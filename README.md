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
            "AZURE_AISEARCH_ENDPOINT": "<endpoint>"
        },
        "Host": {
            "LocalHttpPort": 7071,
            "CORS": "*",
            "CORSCredentials": false
        }
    }
    ```
1. Initialize app/.env.local with a value for `GOOGLE_DRIVE_API_KEY`, `AZURE_AISEARCH_KEY`, and `OPENAI_API_KEY`
1. Install [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).
1. Install the [Azure Web PubSub tunnel tool](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/howto-web-pubsub-tunnel-tool?tabs=bash):

    ```
    npm install -g @azure/web-pubsub-tunnel-tool
    ```
1. In an Azure Web PubSub service instance, create a hub with an event handler with default settings. Set the URL Template to the following:

    ```
    tunnel:///runtime/webhooks/webpubsub
    ```
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