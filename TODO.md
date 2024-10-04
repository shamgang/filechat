# High-priority

* Accessibility
* Prevent DOS from many sessions in one day by doing an index statistics check more often than daily

# Medium-priority

* Add more meaningful loading to form submission - progress bar / status text
* Improve the assistant module - look into agentic flow / agents, assistants - some easy way to include chat history
* Store chat history
* Automated testing
* Add Google Drive file metadata into vector store
* Make a PR to langchainjs/libs/langchain-community/src/vectorstores/azure_aisearch.ts to make it more extensible for different index fields and document formats, and allow ordering, etc.
* Open graph data

# Low-priority

* Server-side validation checks file type, but it should validate all the way through successful parsing into text chunks. File type can surely be spoofed. Watch out for errors from PDFLoader in VectorStore.ts
* Use chunked+resumable upload instead of default form POST to handle larger uploads
* Make UI light/dark theme compatible
* Don't create Google Drive client in module root?
* Azure AI search local emulator
* Make Google Drive file download multi-threaded
* MessageService failure in long-running browser - fails after "Starting client" and before "Client started" with "Websocket connection to _ failed" - handle
* Lift environment variables out of libraries
* Make the limits on the home page dynamic from env variables