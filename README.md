# How this repo was created
1.  `npx create-next-app@latest`
    * all defaults
1. `mkdir functions`
1. Open Visual Studio Code with Azure Functions Core Tools installed
1. F1 -> Azure Functions: Create New Project
1. Select `functions` dir
    * Typescript, V4 runtime
    * Create a temp HTTP function
1. Add a .gitignore in the root
    ```
    # Azurite artifacts
    __blobstorage__
    __queuestorage__
    __azurite_db*__.json
    ```
1. ```npx shadcn@latest init -d```

# Development setup
1. Initialize local.settings.json
    ```
    {
        "IsEncrypted": false,
        "Values": {
            "AzureWebJobsStorage": "UseDevelopmentStorage=true",
            "FUNCTIONS_WORKER_RUNTIME": "node"
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
1. In an Azure Web PubSub service instance, create a hub with an event handler with default settings. Set the URL Template to the following:

    ```
    tunnel:///runtime/webhooks/webpubsub
    ```
1. `cd app && npm install`
1. Open Visual Studio with Azure Functions Core Tools installed
1. Install the [Tailwind IntelliSense plugin](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) and any others needed.
1. Import shadcn/ui components as needed:
    * `npx shadcn@latest add input`
    * `npx shadcn@latest add button`

# Run in development
1. `az login`
1. 
    ```
    awps-tunnel run --hub <hub> --endpoint https://<web pubsub name>.webpubsub.azure.com --upstream http://localhost:7071
    ```
1. F1 -> Azurite: Start
    * Make sure there is only one directory in the workspace or this will fail and you will have to manually start all 3 Azurite services.
1. F5 (Run and Debug)