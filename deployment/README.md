# Deploy to QAS / PRD

Environment-specific backend properties live in `qas.mtaext` and `prd.mtaext`.
They override the srv module properties in the built MTA when passed to `cf deploy -e`.
Shared settings remain in `mta.yaml`. Edit the matching extension when an environment
needs another srv variable; no manual cockpit update or separate restart is needed
after a successful deployment.

| Environment | CF org | SAP destination | SAP client |
| --- | --- | --- | --- |
| QAS | `proconarum-vj-qas` | `VJ_DS4` | `300` |
| PRD | `proconarum-vietjet` | `VJ_PS4` | `900` |

PRD values are taken from the existing `mta.yaml`; update `prd.mtaext` if needed.
The referenced SAP destinations must already exist in the target BTP environment.
Keep destination credentials in BTP, not in these files.

## Build and deploy

Run from the repository root. Install dependencies, Cloud MTA Build Tool (`mbt`),
and the CF CLI with the MultiApps plugin. Log in with `npm.cmd run cf:login` first.

Select the org and actual space before deploying. Replace `YOUR_QAS_SPACE` and
`YOUR_PRD_SPACE` below with existing CF space names; environment selection does not
automatically switch the CF target.

```powershell
# QAS
npm.cmd run cf:qas
cf target -s YOUR_QAS_SPACE
cf target
npm.cmd run deploy:qas

# PRD
npm.cmd run cf:prd
cf target -s YOUR_PRD_SPACE
cf target
npm.cmd run deploy:prd
```

Run each command only if the previous one succeeded. Verify the API, org and space
shown by `cf target` before running the deploy command.

Both npm deploy commands automatically run their `predeploy:*` hook, which reuses
the existing clean + `mbt build` workflow. A failed build stops deployment.
The build includes all current working-tree changes.

## Reuse an already built archive

To deploy the same build to another environment without rebuilding, select and
verify its CF target, then run the appropriate command directly:

```powershell
cf deploy mta_archives/cnma_prorequest_s4h_1.0.0.mtar -e deployment/qas.mtaext --retries 1
cf deploy mta_archives/cnma_prorequest_s4h_1.0.0.mtar -e deployment/prd.mtaext --retries 1
```

The extension is read at deploy time, so changing only its srv properties does not
require rebuilding the MTAR. Application code or base `mta.yaml` changes do require
a rebuild. The existing `npm.cmd run deploy` command retains the base configuration;
use the environment-specific commands to apply these overrides.

After deployment, check `cf env cnma-prorequest-s4h-srv` for the selected values and
`cf app cnma-prorequest-s4h-srv` for application health. `cf env` can include secrets;
do not copy its full output into tickets or logs.
