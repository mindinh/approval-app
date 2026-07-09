# Guide: SSO cho React Web qua SAP AppRouter, XSUAA, IAS và CAP

> Mục tiêu: cấu hình SSO cho **React Web chạy sau AppRouter**, để user đăng nhập qua IAS / Microsoft / corporate IdP, AppRouter giữ session, XSUAA phát JWT đúng cho app, CAP nhận JWT và gọi SAP qua Destination / Principal Propagation.

---

## 1. Kết luận ngắn gọn

Với web React dùng AppRouter, **React không nên tự làm OIDC client** và không cần tự gọi IAS `/oauth2/authorize` / `/oauth2/token`.

Flow đúng nên là:

```txt
Browser
→ AppRouter
→ XSUAA
→ Trust Configuration tới IAS / Microsoft / corporate IdP
→ XSUAA issue JWT cho app BTP
→ AppRouter forward JWT xuống CAP
→ CAP validate JWT
→ CAP gọi Destination / SAP Principal Propagation
```

Điểm quan trọng:

- **Không mất ưu điểm SSO/OIDC**.
- User vẫn có thể login bằng Microsoft account / corporate account thông qua IAS federation.
- Nếu Microsoft / IAS session còn sống, user không phải nhập lại password.
- React web không cần giữ access token trong browser code.
- CAP nhận token đúng dạng XSUAA, phù hợp với Destination Principal Propagation hiện tại.

---

## 2. Phân biệt flow mobile direct IAS và web AppRouter

### 2.1 Mobile direct IAS theo playbook

Playbook mobile ban đầu dùng flow này:

```txt
React Native Mobile
→ SAP IAS OIDC Authorization Code + PKCE
→ nhận IAS access_token / id_token / refresh_token
→ gọi CAP trực tiếp bằng Authorization: Bearer <IAS token>
→ CAP phải bind identity service và accept IAS token
```

Token sẽ có issuer kiểu:

```txt
iss = https://<ias-tenant>.accounts.ondemand.com
```

Flow này phù hợp cho **mobile native/public client**, vì mobile không giữ được client secret.

### 2.2 Web React qua AppRouter

Với web React sau AppRouter, flow nên là:

```txt
React Web
→ AppRouter
→ XSUAA login
→ XSUAA delegate authentication sang IAS / Microsoft
→ XSUAA issue JWT
→ AppRouter forward JWT xuống CAP
```

Token CAP nhận sẽ có issuer kiểu:

```txt
iss = https://<subaccount-subdomain>.authentication.<region>.hana.ondemand.com/oauth/token
```

Ví dụ token đúng cho backend hiện tại có dạng:

```json
{
  "iss": "https://proconarum-development-system.authentication.eu10.hana.ondemand.com/oauth/token",
  "client_id": "sb-cnma-vj-my-inbox!t203402",
  "scope": [
    "cnma-vj-my-inbox!t203402.user",
    "cnma-vj-my-inbox!t203402.admin"
  ],
  "aud": [
    "sb-cnma-vj-my-inbox!t203402",
    "cnma-vj-my-inbox!t203402"
  ]
}
```

Đây là token phù hợp với AppRouter, CAP `xsuaa`, role collection và Principal Propagation.

---

## 3. Vai trò của từng thành phần

| Thành phần | Vai trò |
|---|---|
| React Web | Chỉ render UI và gọi API same-origin như `/api/tasks` |
| AppRouter | Entry point, login redirect, giữ session, proxy API, forward JWT xuống CAP |
| XSUAA | OAuth client của app BTP, issue JWT cho AppRouter/CAP |
| BTP Trust Configuration | Kết nối subaccount với IAS/corporate IdP |
| IAS | Identity broker / SSO layer, có thể federate sang Microsoft Entra ID / Okta / corporate IdP |
| Microsoft / corporate IdP | Nơi user nhập account công ty, giữ corporate SSO session |
| CAP Backend | Validate JWT từ AppRouter, authorize API, gọi SAP qua Destination |
| Destination / Connectivity | Kết nối tới SAP/S4, có thể dùng Principal Propagation |

---

## 4. Những config IAS nào còn áp dụng cho web AppRouter?

### 4.1 Còn áp dụng

Các phần này vẫn quan trọng:

```txt
- IAS tenant được trust bởi BTP subaccount
- Corporate IdP federation, ví dụ Microsoft Entra ID
- Default Identity Provider / Conditional Authentication
- MFA policy
- Password policy nếu dùng IAS local user
- Session/cookie behavior của IAS/corporate IdP
- Attribute mapping từ Microsoft/IdP về IAS/XSUAA
```

Các phần này giúp user **không phải nhập password nhiều lần** nếu session IAS/Microsoft còn sống.

### 4.2 Không còn là phần chính

Nếu web React không direct OIDC tới IAS nữa, thì các config trong **IAS OIDC Application riêng** như sau không còn quyết định JWT mà CAP nhận:

```txt
- Access token lifetime của IAS OIDC app
- ID token lifetime của IAS OIDC app
- Refresh token lifetime của IAS OIDC app
- Redirect URI của IAS OIDC app
- OIDC client id của IAS app dùng cho direct PKCE
```

Vì với AppRouter, token chính đi vào CAP là **XSUAA token**, không phải IAS direct token.

---

## 5. Chỗ cấu hình để user không phải login nhiều lần

Với web AppRouter có 3 session/token layer:

```txt
1. Microsoft / IAS session
   → quyết định user có phải nhập lại password/MFA không

2. XSUAA token/refresh token
   → quyết định JWT cho BTP app sống bao lâu

3. AppRouter session
   → quyết định browser session của web app sống bao lâu khi inactive
```

### 5.1 IAS / Microsoft session

Cấu hình ở IAS hoặc corporate IdP:

```txt
Cloud Identity Services Admin Console
→ Identity Providers / Applications / Conditional Authentication / Policies
```

Mục tiêu:

- User login qua Microsoft/corporate account.
- Nếu Microsoft session còn sống, user được SSO silent / không cần nhập lại password.
- MFA policy theo yêu cầu bảo mật.

### 5.2 XSUAA token validity

Cấu hình trong `xs-security.json`:

```json
{
  "xsappname": "cnma-vj-my-inbox",
  "tenant-mode": "dedicated",
  "oauth2-configuration": {
    "token-validity": 43200,
    "refresh-token-validity": 604800
  }
}
```

Ý nghĩa:

```txt
token-validity = access token lifetime, đơn vị giây
refresh-token-validity = refresh token lifetime, đơn vị giây
```

Ví dụ:

```txt
43200 giây = 12 giờ
604800 giây = 7 ngày
```

### 5.3 AppRouter session timeout

Cấu hình trong `mta.yaml` của approuter:

```yaml
modules:
  - name: cnma-vj-my-inbox-approuter
    type: approuter.nodejs
    properties:
      SESSION_TIMEOUT: 60
      JWT_REFRESH: 5
```

Ý nghĩa:

```txt
SESSION_TIMEOUT = số phút session AppRouter còn sống nếu user inactive
JWT_REFRESH = AppRouter refresh JWT trước khi token hết hạn bao nhiêu phút
```

---

## 6. Cấu hình BTP Trust Configuration

Vào:

```txt
BTP Cockpit
→ DEV Subaccount
→ Security
→ Trust Configuration
```

Checklist:

```txt
[ ] Trust configuration tới đúng IAS/corporate IdP đang Active
[ ] Available for User Logon = Yes nếu muốn user thấy option login
[ ] User login được bằng IdP đó
[ ] Không dùng nhầm IAS tenant khác subaccount/app
[ ] Attribute mapping đúng email / user_name
```

Kết quả mong muốn là khi user login web app, XSUAA phát JWT có issuer dạng:

```txt
https://<subaccount-subdomain>.authentication.<region>.hana.ondemand.com/oauth/token
```

Không phải:

```txt
https://<ias-tenant>.accounts.ondemand.com
```

---

## 7. Cấu hình XSUAA

### 7.1 `xs-security.json`

Ví dụ tối thiểu:

```json
{
  "xsappname": "cnma-vj-my-inbox",
  "tenant-mode": "dedicated",
  "oauth2-configuration": {
    "token-validity": 43200,
    "refresh-token-validity": 604800
  },
  "scopes": [
    {
      "name": "$XSAPPNAME.user",
      "description": "Use My Inbox app"
    },
    {
      "name": "$XSAPPNAME.admin",
      "description": "Administer My Inbox app"
    }
  ],
  "role-templates": [
    {
      "name": "User",
      "description": "My Inbox User",
      "scope-references": [
        "$XSAPPNAME.user"
      ]
    },
    {
      "name": "Admin",
      "description": "My Inbox Admin",
      "scope-references": [
        "$XSAPPNAME.admin",
        "$XSAPPNAME.user"
      ]
    }
  ],
  "role-collections": [
    {
      "name": "CNMA-VJ-INBOX-User",
      "role-template-references": [
        "$XSAPPNAME.User"
      ]
    },
    {
      "name": "CNMA-VJ-INBOX-Admin",
      "role-template-references": [
        "$XSAPPNAME.Admin"
      ]
    }
  ]
}
```

### 7.2 Assign role collection

Sau deploy/update XSUAA:

```txt
BTP Cockpit
→ DEV Subaccount
→ Security
→ Role Collections
→ CNMA-VJ-INBOX-User hoặc Admin
→ Edit
→ Add user
```

Nếu user login được nhưng gọi API bị `403`, thường là thiếu role/scope.

---

## 8. Cấu hình AppRouter

### 8.1 `xs-app.json`

Ví dụ:

```json
{
  "welcomeFile": "/index.html",
  "authenticationMethod": "route",
  "routes": [
    {
      "source": "^/api/(.*)$",
      "target": "/api/$1",
      "destination": "srv-api",
      "authenticationType": "xsuaa",
      "csrfProtection": false
    },
    {
      "source": "^(.*)$",
      "localDir": "resources",
      "authenticationType": "xsuaa"
    }
  ]
}
```

Ý nghĩa:

```txt
- Static React cũng phải login
- /api/* cũng phải login
- React không cần tự cầm token
- AppRouter forward JWT xuống CAP qua destination srv-api
```

### 8.2 AppRouter destination tới CAP

Trong `mta.yaml`:

```yaml
modules:
  - name: cnma-vj-my-inbox-srv
    type: nodejs
    provides:
      - name: srv-api
        properties:
          srv-url: ${default-url}
    requires:
      - name: cnma-vj-my-inbox-xsuaa
      - name: cnma-vj-my-inbox-destination
      - name: cnma-vj-my-inbox-connectivity

  - name: cnma-vj-my-inbox-approuter
    type: approuter.nodejs
    requires:
      - name: cnma-vj-my-inbox-xsuaa
      - name: srv-api
    properties:
      SESSION_TIMEOUT: 60
      JWT_REFRESH: 5
      destinations: >
        [
          {
            "name": "srv-api",
            "url": "~{srv-api/srv-url}",
            "forwardAuthToken": true
          }
        ]
```

Điểm critical:

```txt
forwardAuthToken = true
```

Nếu thiếu, CAP sẽ không nhận JWT và dễ ra `anonymous`, `hasJwt=false`, hoặc 401/403.

---

## 9. Cấu hình CAP

### 9.1 `package.json` / CAP auth

Với web AppRouter:

```json
{
  "cds": {
    "requires": {
      "auth": {
        "kind": "xsuaa"
      }
    }
  }
}
```

Local dev có thể dùng `mocked`, nhưng khi test Principal Propagation phải chạy hybrid/real service:

```bash
cds watch --profile hybrid
```

Check:

```bash
cds env get requires.auth --profile hybrid
```

Expected:

```json
{
  "kind": "xsuaa",
  "credentials": {
    "...": "..."
  }
}
```

### 9.2 Custom Express route `/api/tasks`

Nếu dùng custom Express route như `/api/tasks`, cần ensure JWT middleware chạy trước router.

Nếu code chỉ bật auth khi `NODE_ENV === 'production'`, local hybrid có thể bị skip và sinh `anonymous`. Nên thêm flag:

```ts
const shouldEnableJwtAuth =
  isXsuaa &&
  (process.env.NODE_ENV === 'production' ||
    process.env.ENABLE_JWT_AUTH === 'true');
```

Rồi dùng:

```ts
if (shouldEnableJwtAuth) {
  app.use(inboxMountPaths, passport.authenticate('JWT', { session: false, failWithError: true }));
}
```

Chạy local hybrid:

```bash
ENABLE_JWT_AUTH=true cds watch --profile hybrid
```

Expected startup log:

```txt
[Server] XSUAA middleware enabled for /api and /api/inbox
```

Không được là:

```txt
Skipping XSUAA JWT authentication for /api and /api/inbox in local development
```

---

## 10. React Web code

React web không cần OIDC/PKCE code.

Không dùng:

```txt
- IAS issuer trong React env
- IAS client id trong React env
- oidc-client để tự login
- Authorization: Bearer token tự lấy
- refresh token lưu trong browser app
```

Chỉ gọi API same-origin:

```ts
export async function fetchTasks() {
  const res = await fetch('/api/tasks?$top=20&$format=json', {
    headers: {
      Accept: 'application/json'
    },
    credentials: 'include'
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  return res.json();
}
```

User chưa login thì AppRouter tự redirect tới login.

---

## 11. Expected runtime result

Sau khi user login qua AppRouter và React gọi `/api/tasks`, response backend nên có identity dạng:

```json
{
  "identity": {
    "id": "minh.dinh@conarum.com",
    "sapUser": "MINH.DINH@CONARUM.COM",
    "isImpersonated": false,
    "hasJwt": true,
    "tokenSource": "authorization"
  }
}
```

JWT backend nhận nên decode ra:

```json
{
  "iss": "https://proconarum-development-system.authentication.eu10.hana.ondemand.com/oauth/token",
  "client_id": "sb-cnma-vj-my-inbox!t203402",
  "scope": [
    "cnma-vj-my-inbox!t203402.user"
  ],
  "aud": [
    "sb-cnma-vj-my-inbox!t203402",
    "cnma-vj-my-inbox!t203402"
  ]
}
```

Nếu JWT decode ra:

```json
{
  "iss": "https://<ias>.accounts.ondemand.com"
}
```

thì flow đang đi nhầm direct IAS/OIDC, không phải AppRouter/XSUAA.

---

## 12. Troubleshooting

### 12.1 User bị login nhiều lần

Check:

```txt
[ ] AppRouter SESSION_TIMEOUT quá ngắn?
[ ] XSUAA token-validity quá ngắn?
[ ] XSUAA refresh-token-validity quá ngắn?
[ ] IAS/Microsoft session policy quá ngắn?
[ ] Browser đang block cookies?
[ ] App được mở bằng srv URL thay vì approuter URL?
```

### 12.2 CAP trả `anonymous`

Check:

```txt
[ ] AppRouter route /api có authenticationType xsuaa chưa?
[ ] Destination srv-api có forwardAuthToken true chưa?
[ ] CAP srv có bind cùng XSUAA chưa?
[ ] CAP auth kind có phải xsuaa không?
[ ] Custom Express route có chạy passport JWT middleware không?
[ ] Request có Authorization header xuống CAP không?
```

### 12.3 API trả 401

Check:

```txt
[ ] JWT issuer có phải XSUAA subaccount không?
[ ] CAP bind đúng XSUAA instance không?
[ ] AppRouter và CAP có dùng cùng XSUAA không?
[ ] Token expired không?
```

### 12.4 API trả 403

Check:

```txt
[ ] User đã được assign Role Collection chưa?
[ ] Token có scope app `.user` hoặc `.admin` chưa?
[ ] CAP annotation @requires có match role/scope không?
```

### 12.5 Destination Principal Propagation lỗi

Check:

```txt
[ ] CAP có nhận JWT không? hasJwt=true?
[ ] Destination Authentication = PrincipalPropagation?
[ ] Destination nằm đúng subaccount?
[ ] Connectivity service bind đúng chưa?
[ ] Cloud Connector mapping/principal propagation đúng chưa?
[ ] SAP backend nhận user mapping đúng chưa?
```

---

## 13. Checklist triển khai cuối cùng

```txt
[ ] Bỏ direct IAS/OIDC code khỏi React web
[ ] React gọi API bằng relative path `/api/...`
[ ] BTP Trust Configuration trỏ đúng IAS/corporate IdP
[ ] xs-security.json có scope/role-template/role-collection đúng
[ ] User được assign role collection
[ ] AppRouter bind XSUAA
[ ] CAP srv bind cùng XSUAA
[ ] xs-app.json protect static + API bằng authenticationType xsuaa
[ ] AppRouter destination `srv-api` có forwardAuthToken=true
[ ] CAP auth kind = xsuaa khi deploy/hybrid
[ ] Custom Express route bật JWT middleware
[ ] Test bằng AppRouter URL, không mở trực tiếp srv URL
[ ] Backend identity trả hasJwt=true, isImpersonated=false
[ ] Destination Principal Propagation xuống SAP OK
```

---

## 14. One-liner mental model

```txt
React Web không làm SSO trực tiếp.
AppRouter làm SSO.
XSUAA phát JWT đúng app/subaccount.
IAS/Microsoft vẫn giữ lợi ích SSO.
CAP nhận JWT và dùng nó cho authorization + SAP Principal Propagation.
```
