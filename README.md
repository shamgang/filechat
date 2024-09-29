# How this repo was created
1. `npx create-next-app@latest`
    * all defaults
1. `mkdir functions`
1. Open Visual Studio Code with Azure Functions Core Tools installed
1. F1 -> Azure Functions: Create New Project
1. Select `functions` dir
    * Typescript, V4 runtime
    * Create a temp HTTP function
1. In `functions`, change the `tsconfig.json` `module` field to `nodenext`
1. Add a .gitignore in the root
    ```
    # Azurite artifacts
    __blobstorage__
    __queuestorage__
    __azurite_db*__.json
    ```
1. In `app`, ```npx shadcn@latest init -d```
1. In `.vscode/settings.json`, set `"css.validate": false`
1. In `app`, `npm init stylelint`
1. In `app`, add the following stylelint rule:
    ```
    "rules": {
      "at-rule-no-unknown": [
        true,
        {
          "ignoreAtRules": ["tailwind"]
        }
      ]
    }
    ```
1. Created a `shared` folder as a basic TS package
1. Create a `package.json` in the root including the `app`, `functions`, and `shared` workspaces

# Development setup
1. Initialize functions/local.settings.json, replacing anything marked in <>
    ```
    {
        "IsEncrypted": false,
        "Values": {
            "AzureWebJobsStorage": "UseDevelopmentStorage=true",
            "FUNCTIONS_WORKER_RUNTIME": "node",
            "WebPubSubConnectionString": "<connectionString>",
            "WEB_PUBSUB_HUB": "<hubName>",
            "OPENAI_API_KEY": "<apiKey>",
            "OPENAI_CHAT_MODEL": "<model>",
            "AZURE_AISEARCH_KEY": "<adminKey>",
            "AZURE_AISEARCH_INDEX_NAME": "<indexName>",
            "AZURE_AISEARCH_ENDPOINT": "<endpoint>",
            "DOCUMENT_LIFETIME_MIN": 1440
        },
        "Host": {
            "LocalHttpPort": 7071,
            "CORS": "*",
            "CORSCredentials": false
        }
    }
    ```
1. Install [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).
1. Install the [Azure Web PubSub tunnel tool](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/howto-web-pubsub-tunnel-tool?tabs=bash):

    ```
    npm install -g @azure/web-pubsub-tunnel-tool
    ```
1. In an Azure Web PubSub service instance, add the Web PubSub Service Owner role to your identity, and create a hub `filechat` with an event handler with default settings. Set the URL Template to the following:

    ```
    tunnel:///runtime/webhooks/webpubsub
    ```
1. Create a an Azure AI search instance
1. Create a dev App Insights instance (with corresponding dev Log Analytics workspace)
1. Initialize app/.env.development.local with a value for `NEXT_PUBLIC_APP_INSIGHTS_CONN`
1. Create app/.env.local with values for `GOOGLE_DRIVE_API_KEY`, `AZURE_AISEARCH_ENDPOINT`, `AZURE_AISEARCH_KEY`, and `OPENAI_API_KEY`
1. `npm install`
1. Open Visual Studio with Azure Functions Core Tools installed
1. Install the [Tailwind IntelliSense plugin](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) and any others needed.
1. Install the `vscode-stylelint` extension

# Run in development
1. `az login`
1. 
    ```
    awps-tunnel run --hub <hub> --endpoint https://<web pubsub name>.webpubsub.azure.com --upstream http://localhost:7071
    ```
1. F1 -> Azurite: Start
    * If there is more than one directory in the workspace you will have to manually start all 3 Azurite services by clicking them in the bottom bar and choosing the root folder of this project.
1. F5 (Run and Debug)
1. In `app`, `npm run dev`
1. Make sure to rebuild the `shared/` package with `npm run build` when changing it, or `npm run watch` to keep the `dist` folder updated. This may not register with the Next watcher, so you may need to restart Next.

# Deployment
1. Create a prod Web PubSub Service, a prod Application Insights instance (with corresponding Log Analytics workspace), and a prod storage account.
1. Initialize app/.env.production.local with a value for `NEXT_PUBLIC_APP_INSIGHTS_CONN`
1. F1 -> Azure Static Web Apps: Create a Static Web App. Specify `app` folder and `.next` build folder.
1. Modify the generated workflow file to have an empty string for `api_location` and add an `env` key to the `steps` for the `build_and_deploy_job`. Add all environment variables from .env.production, .env.production.local, and .env.local as keys under `env`, and the value should be `${{ secrets.<variable_name> }}`. Do not include the actual value.
1. Go to the Github repo, Settings -> Secrets and variables -> Actions and add all of the env variables as secrets.
1. In Azure, move the new SWA into the correct resource group.
1. Set all the same environment variables that were set in Github in the SWA as well.
1. TODO Create a function app and static web app from VScode
1. TODO Take all environment variables in app/.env* and add them to the Static Web App environment variables as well as the Github Secrets, and add them to your Static Web App Github workflow
1. TODO Take all environment variables in functions/local.settings.json and add them to the Function app environment variables
1. On the function app, set `AzureWebJobsSecretStorageType` to `blob`. This will prevent the key that connects PubSub and the function app from re-generating on deployment.
1. Note the `webpubsub_extension` key from Function -> App keys in the function app, create a hub `filechat` in the prod Web PubSub instance, and add an event handler with the following endpoint, replacing the the function app name and using the `webpubsub_extension` key:
    ```
    https://<FUNCTIONAPP_NAME>.azurewebsites.net/runtime/webhooks/webpubsub?code=<APP_KEY>
    ```