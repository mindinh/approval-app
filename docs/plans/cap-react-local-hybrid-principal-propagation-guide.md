# Guide test local CAP + React với BTP Destination Principal Propagation

> Mục tiêu: chạy **React + CAP ở local**, nhưng CAP vẫn bind tới service thật trên **BTP Cockpit** như XSUAA/IAS, Destination, Connectivity để gọi xuống SAP S/4 on-premise bằng **Principal Propagation** và lấy đúng SAP user.

---

## 1. Bức tranh tổng quan

Local dev sẽ không chỉ là `npm start` / `cds watch` bình thường. Vì muốn dùng Destination Principal Propagation, CAP local cần có cloud service credentials giống lúc chạy trên BTP.

Flow mong muốn:

```text
React local
  -> gọi CAP local kèm Bearer JWT user
CAP local
  -> dùng binding tới XSUAA/IAS, Destination, Connectivity trên BTP
  -> lấy destination config
  -> exchange / forward user token
  -> Cloud Connector
  -> SAP S/4 on-premise
  -> user được map thành SAP user thật
```

Có 2 mode test chính:

```text
Mode A - Test nhanh backend:
Postman -> CAP local + Bearer JWT

Mode B - Gần production hơn:
Browser -> Local AppRouter -> React/CAP local -> BTP Destination/Connectivity -> S/4
```

---

## 2. Kết luận nhanh

Bạn **có thể lấy JWT rồi paste vào Postman/local request** để test nhanh.

Nhưng để Principal Propagation chạy được, chỉ JWT là **chưa đủ**. CAP local còn phải bind tới các service thật trên BTP:

```text
- XSUAA hoặc IAS / Identity service
- Destination service
- Connectivity service
- Destination đã cấu hình PrincipalPropagation / OAuth2UserTokenExchange đúng
- Cloud Connector đã map virtual host/path đúng
- S/4 đã trust/mapping user đúng
```

JWT chỉ là **user identity input**. Binding tới BTP service mới là thứ giúp CAP local gọi được Destination/Connectivity thật.

---

## 3. Checklist trên BTP trước khi test local

### 3.1 Service instances cần có

Trong BTP Cockpit / Cloud Foundry space, kiểm tra có các service instance sau:

```text
<app-xsuaa>          XSUAA hoặc Authorization & Trust Management
<app-destination>    Destination service
<app-connectivity>   Connectivity service
```

Ví dụ:

```bash
cf services
```

Kỳ vọng thấy tương tự:

```text
name                         service                  plan
my-app-xsuaa                 xsuaa                    application
my-app-destination           destination              lite
my-app-connectivity          connectivity             lite
```

> Nếu app đang dùng IAS trực tiếp thay vì XSUAA, vẫn cần xác định service binding và token flow tương ứng. Với CAP + AppRouter truyền thống, XSUAA vẫn là setup phổ biến hơn.

---

### 3.2 Destination cần kiểm tra
## NOTES: Destination đã có trong BTP Cockpit
Trong BTP Cockpit > Connectivity > Destinations, destination gọi S/4 nên có concept như sau:

```text
Name: S4_PRINCIPAL_PROPAGATION
Type: HTTP
URL: http://<virtual-host>:<virtual-port>
ProxyType: OnPremise
Authentication: PrincipalPropagation
```

Hoặc một số landscape có thể dùng token exchange:

```text
Authentication: OAuth2UserTokenExchange
```

Tùy cách công ty setup trust/IAS/XSUAA/S/4.

Các property thường gặp:

```text
HTML5.DynamicDestination: true        # nếu dùng AppRouter/HTML5 app cần dynamic destination
WebIDEEnabled: true                   # optional cho dev tooling
sap-client: <client>                  # nếu cần client mặc định
```

---

### 3.3 Cloud Connector cần kiểm tra

Trong SAP Cloud Connector:

```text
Subaccount mapping: đúng subaccount BTP
Backend system: S/4 hoặc ECC on-premise
Virtual host/port: khớp với Destination URL
Resources: path OData/API đã allow
Principal Propagation: enabled nếu dùng PrincipalPropagation
```

Ví dụ path cần allow:

```text
/sap/opu/odata/IWPGW/TASKPROCESSING;v=2
/sap/opu/odata/sap/API_PURCHASEREQ_PROCESS_SRV
/sap/opu/odata/sap/API_BUSINESS_PARTNER
```

---

### 3.4 S/4 cần kiểm tra

Phía S/4 phải có setup để nhận propagated identity:

```text
- Trust với Cloud Connector / IdP setup đúng
- User mapping từ cloud user sang SAP user đúng
- SAP user có role/authorization để gọi API
- SICF service active
- OData service active trong /IWFND/MAINT_SERVICE nếu là Gateway service
```

Nếu user mapping sai, request có thể tới được S/4 nhưng vẫn lỗi 401/403.

---

## 4. Setup CAP project để chạy hybrid local

### 4.1 Login Cloud Foundry

```bash
cf login -a https://api.cf.<region>.hana.ondemand.com
cf target -o <ORG> -s <SPACE>
```

Ví dụ EU10:

```bash
cf login -a https://api.cf.eu10.hana.ondemand.com
```

Kiểm tra target:

```bash
cf target
```

---

### 4.2 Bind service cloud vào local project

Từ root CAP project:

```bash
cds bind auth --to <xsuaa-instance-name>
cds bind destination --to <destination-instance-name>
cds bind connectivity --to <connectivity-instance-name>
```

Ví dụ:

```bash
cds bind auth --to my-app-xsuaa
cds bind destination --to my-app-destination
cds bind connectivity --to my-app-connectivity
```

Nếu service name trong `package.json` / `.cdsrc.json` là `uaa` thay vì `auth`, dùng đúng tên đó:

```bash
cds bind uaa --to my-app-xsuaa
```

Kiểm tra binding đã tạo:

```bash
cds bind --list
```

File thường được tạo/cập nhật:

```text
.cdsrc-private.json
```

> File này chứa reference tới service binding local. Không nên commit nếu có thông tin nhạy cảm.

---

### 4.3 Cấu hình package.json / cds.requires

Ví dụ concept:

```json
{
  "cds": {
    "requires": {
      "auth": {
        "kind": "xsuaa"
      },
      "S4": {
        "kind": "odata-v2",
        "model": "srv/external/S4",
        "credentials": {
          "destination": "S4_PRINCIPAL_PROPAGATION",
          "path": "/sap/opu/odata/IWPGW/TASKPROCESSING;v=2"
        }
      }
    }
  }
}
```

Nếu bạn chưa generate EDMX/model external và chỉ muốn forward request thủ công, có thể dùng SAP Cloud SDK hoặc call HTTP qua destination trong handler.

---

## 5. Chạy CAP local với cloud binding

Dùng lệnh này để inject service credentials vào process local:

```bash
cds bind --exec -- cds watch --profile hybrid
```

Hoặc:

```bash
cds bind --exec -- npm run watch
```

Nếu project đã setup script:

```json
{
  "scripts": {
    "watch:hybrid": "cds bind --exec -- cds watch --profile hybrid"
  }
}
```

Chạy:

```bash
npm run watch:hybrid
```

CAP local thường chạy ở:

```text
http://localhost:4004
```

---

## 6. Cách lấy JWT để test nhanh bằng Postman

Có 3 cách phổ biến.

---

### Cách A - Lấy token từ deployed AppRouter / app đang chạy trên BTP

Cách này thực tế nhất nếu app đã deploy và login được.

Flow:

```text
1. Mở app deployed trên BTP
2. Login bằng user thật
3. Mở DevTools > Network
4. Tìm request gọi backend CAP
5. Copy Authorization: Bearer <token>
6. Paste token vào Postman để gọi CAP local
```

Postman:

```http
GET http://localhost:4004/odata/v4/<service>/<entity>
Authorization: Bearer <JWT>
```

Ưu điểm:

```text
- Token là user token thật
- Dễ test nhanh
- Không cần dựng AppRouter local ngay
```

Nhược điểm:

```text
- Token hết hạn thì phải lấy lại
- Không đại diện hoàn toàn cho flow local React/AppRouter
```

---

### Cách B - Lấy token bằng OAuth password grant

Chỉ dùng được nếu tenant/client cho phép password grant. Nhiều hệ thống production sẽ disable cách này.

```bash
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=<clientid>" \
  -d "client_secret=<clientsecret>" \
  -d "username=<username>" \
  -d "password=<password>" \
  "<xsuaa-url>/oauth/token"
```

Response:

```json
{
  "access_token": "<JWT>",
  "token_type": "bearer",
  "expires_in": 43199
}
```

> Không khuyến khích dùng lâu dài. Dùng để debug nhanh thì ok nếu policy cho phép.

---

### Cách C - Dùng local AppRouter để login browser flow

Đây là cách giống production hơn, nên ưu tiên khi muốn test end-to-end.

---

## 7. Test nhanh bằng Postman

### 7.1 Request test CAP local

```http
GET http://localhost:4004/odata/v4/my/Tasks
Authorization: Bearer <JWT>
```

Trong CAP handler, log thử user:

```js
this.on('READ', 'Tasks', async (req) => {
  console.log('req.user.id:', req.user.id)
  console.log('req.user.roles:', req.user.roles)
  console.log('authorization:', req.headers.authorization)

  // logic gọi S/4 ở đây
})
```

Kỳ vọng:

```text
req.user.id có user thật
req.user.roles có role/scopes nếu token hợp lệ
authorization có Bearer token
```

---

### 7.2 Test gọi destination trong CAP handler

Nếu dùng SAP Cloud SDK:

```js
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client')

module.exports = cds.service.impl(async function () {
  this.on('READ', 'Tasks', async (req) => {
    const result = await executeHttpRequest(
      {
        destinationName: 'S4_PRINCIPAL_PROPAGATION',
        jwt: req.headers.authorization?.replace('Bearer ', '')
      },
      {
        method: 'GET',
        url: '/sap/opu/odata/IWPGW/TASKPROCESSING;v=2/TaskCollection',
        headers: {
          Accept: 'application/json'
        }
      }
    )

    return result.data.d?.results || result.data.value || []
  })
})
```

Nếu dùng CAP remote service:

```js
module.exports = cds.service.impl(async function () {
  const s4 = await cds.connect.to('S4')

  this.on('READ', 'Tasks', async (req) => {
    return s4.tx(req).run(req.query)
  })
})
```

> Với remote service, cần đảm bảo CAP context có user token và destination config đúng. Nếu không propagate được, chuyển sang Cloud SDK explicit `jwt` để debug rõ hơn.

---

## 8. Test bằng React local

### 8.1 Cách nhanh: paste token vào React local

Trong `.env.local` hoặc `.env.development`:

```env
VITE_CAP_BASE_URL=http://localhost:4004
VITE_DEV_JWT=<paste-jwt-here>
```

Ví dụ fetch:

```ts
const res = await fetch(`${import.meta.env.VITE_CAP_BASE_URL}/odata/v4/my/Tasks`, {
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_DEV_JWT}`,
    Accept: 'application/json'
  }
})

const data = await res.json()
```

> Cách này chỉ nên dùng local dev. Không commit JWT vào git.

---

### 8.2 Cách chuẩn hơn: chạy local AppRouter

Cấu trúc ví dụ:

```text
project-root/
  app/
    router/
      package.json
      xs-app.json
  srv/
  package.json
```

`app/router/package.json`:

```json
{
  "scripts": {
    "start": "node node_modules/@sap/approuter/approuter.js"
  },
  "dependencies": {
    "@sap/approuter": "latest"
  }
}
```

`app/router/xs-app.json` ví dụ:

```json
{
  "welcomeFile": "/index.html",
  "authenticationMethod": "route",
  "routes": [
    {
      "source": "^/api/(.*)$",
      "target": "/odata/v4/$1",
      "destination": "cap-local",
      "authenticationType": "xsuaa"
    },
    {
      "source": "^(.*)$",
      "localDir": "../react-ui/dist",
      "authenticationType": "xsuaa"
    }
  ]
}
```

Local default-env cho AppRouter có thể cần destination trỏ về CAP local:

```json
{
  "destinations": [
    {
      "name": "cap-local",
      "url": "http://localhost:4004",
      "forwardAuthToken": true
    }
  ]
}
```

Chạy AppRouter local với service binding:

```bash
cds bind --exec -- npm start --prefix app/router
```

AppRouter thường chạy ở:

```text
http://localhost:5000
```

Flow lúc này:

```text
Browser -> http://localhost:5000
AppRouter redirect login
AppRouter forward token xuống CAP local
CAP local gọi S/4 qua Destination/Connectivity
```

---

## 9. Debug token và user mapping

### 9.1 Decode JWT

Copy JWT vào jwt.io hoặc dùng CLI:

```bash
node -e "console.log(JSON.parse(Buffer.from(process.argv[1].split('.')[1], 'base64url').toString()))" '<JWT>'
```

Check các claim quan trọng:

```text
iss       issuer đúng tenant không
client_id đúng app/client không
user_name / email / sub có user không
scope     có scope app không
aud       audience có match app không
exp       token còn hạn không
```

---

### 9.2 Log trong CAP

```js
console.log('user id', req.user?.id)
console.log('user attr', req.user?.attr)
console.log('user roles', req.user?.roles)
console.log('headers auth exists', !!req.headers.authorization)
```

Nếu `req.user` là anonymous:

```text
- CAP chưa bật auth đúng
- Request không có Authorization header
- Token không hợp lệ với XSUAA/IAS binding hiện tại
- Chạy CAP chưa qua cds bind --exec
```

---

### 9.3 Check request tới S/4

Nếu lỗi từ S/4:

```text
401 Unauthorized:
- Token/user không được propagate đúng
- Trust/user mapping sai
- Principal Propagation config sai

403 Forbidden:
- User đã vào được S/4 nhưng thiếu authorization
- OData service authorization thiếu
- Role SAP user chưa đủ

404 Not Found:
- Destination URL/path sai
- Cloud Connector resource path chưa allow
- OData service chưa active

502/503:
- Cloud Connector down/offline
- Virtual host/port sai
- Connectivity service/binding sai
```

---

## 10. Troubleshooting theo triệu chứng

### Case 1: CAP local không đọc được service binding

Triệu chứng:

```text
No binding found
Destination service not found
VCAP_SERVICES missing
```

Fix:

```bash
cf target
cds bind --list
cds bind --exec -- cds watch --profile hybrid
```

Nếu binding thiếu:

```bash
cds bind destination --to <destination-instance>
cds bind connectivity --to <connectivity-instance>
cds bind auth --to <xsuaa-instance>
```

---

### Case 2: Postman gọi CAP local bị 401

Check:

```text
- Header Authorization đúng format: Bearer <JWT>
- Token chưa hết hạn
- Token lấy từ đúng tenant/client
- CAP đang chạy với profile hybrid và binding đúng
- xs-security / scopes / role collection đã assign cho user
```

---

### Case 3: CAP nhận user nhưng gọi S/4 bị 401

Nguyên nhân hay gặp:

```text
- Destination chưa dùng PrincipalPropagation/OAuth2UserTokenExchange đúng
- Cloud Connector chưa enable principal propagation
- Backend S/4 chưa trust đúng
- User mapping từ cloud user sang SAP user sai
- JWT truyền vào destination không phải user token
```

Debug nên làm:

```text
1. Log req.user trong CAP
2. Decode JWT xem user claim
3. Test destination trong BTP Cockpit nếu có thể
4. Check Cloud Connector trace
5. Check S/4 Gateway error log /IWFND/ERROR_LOG
6. Check SU53 cho SAP user tương ứng nếu vào được nhưng thiếu quyền
```

---

### Case 4: Gọi qua React local bị CORS

Nếu React gọi thẳng CAP local:

```text
React localhost:3000 -> CAP localhost:4004
```

Có thể bị CORS. Cách xử lý:

```text
- Dùng proxy dev server của Vite/CRA
- Hoặc gọi qua local AppRouter
- Hoặc enable CORS local-only trong CAP
```

Với Vite:

```ts
export default defineConfig({
  server: {
    proxy: {
      '/odata': 'http://localhost:4004'
    }
  }
})
```

Nhưng nếu muốn giống production, nên dùng AppRouter.

---

## 11. Recommended local workflow

### Phase 1 - Test backend trước

```text
1. Bind CAP local tới XSUAA/Destination/Connectivity
2. Chạy CAP bằng cds bind --exec
3. Lấy user JWT từ deployed app hoặc OAuth flow
4. Gọi Postman vào CAP local
5. Confirm req.user có user thật
6. Confirm CAP gọi được S/4 qua destination
```

Lệnh chính:

```bash
cds bind --exec -- cds watch --profile hybrid
```

Postman:

```http
GET http://localhost:4004/odata/v4/my/Tasks
Authorization: Bearer <JWT>
```

---

### Phase 2 - Test React nhanh

```text
1. React local gọi CAP local
2. Paste JWT vào env local
3. Confirm UI load được data từ CAP local
```

---

### Phase 3 - Test gần production

```text
1. Setup local AppRouter
2. AppRouter bind XSUAA
3. AppRouter forwardAuthToken xuống CAP local
4. Browser login thật
5. React gọi /api/...
6. CAP gọi S/4 bằng propagated user
```

Lệnh chính:

```bash
cds bind --exec -- npm start --prefix app/router
```

---

## 12. Checklist hoàn thành

Bạn có thể xem là setup local đã ổn khi pass hết checklist này:

```text
[ ] cf login đúng org/space
[ ] cf services thấy xsuaa/destination/connectivity
[ ] cds bind --list thấy đủ binding
[ ] CAP chạy bằng cds bind --exec
[ ] Postman gọi CAP local với Bearer JWT không còn 401
[ ] req.user.id là user thật, không phải anonymous
[ ] CAP gọi destination không báo missing destination/connectivity
[ ] Cloud Connector nhận request
[ ] S/4 nhận propagated user hoặc mapped SAP user
[ ] API S/4 trả data đúng theo authorization của user đó
[ ] React local gọi được CAP local
[ ] Nếu dùng AppRouter local, login browser flow chạy được
```

---

## 13. Cấu trúc lệnh tổng hợp

```bash
# 1. Login CF
cf login -a https://api.cf.<region>.hana.ondemand.com
cf target -o <ORG> -s <SPACE>

# 2. Check services
cf services

# 3. Bind services vào local CAP project
cds bind auth --to <xsuaa-instance-name>
cds bind destination --to <destination-instance-name>
cds bind connectivity --to <connectivity-instance-name>

# 4. Check binding
cds bind --list

# 5. Run CAP local hybrid
cds bind --exec -- cds watch --profile hybrid

# 6. Optional: run local AppRouter
cds bind --exec -- npm start --prefix app/router
```

---

## 14. Ghi chú bảo mật

Không nên commit các file/token sau:

```text
.cdsrc-private.json
default-env.json
.env.local
JWT pasted token
client_secret
service key json
```

Nên thêm vào `.gitignore`:

```gitignore
.cdsrc-private.json
default-env.json
.env.local
*.jwt
service-key*.json
```

---

## 15. Chốt kiến trúc nên dùng

Với giai đoạn dev hiện tại, nên đi theo thứ tự này:

```text
1. Postman + JWT + CAP local hybrid
   -> nhanh nhất để debug principal propagation

2. React local + paste JWT
   -> nhanh để test UI gọi CAP

3. Local AppRouter + CAP local hybrid
   -> giống production nhất, nên dùng khi flow backend đã ổn
```

Không nên debug tất cả cùng lúc từ đầu, vì sẽ khó biết lỗi nằm ở React, AppRouter, CAP, Destination, Cloud Connector hay S/4.

