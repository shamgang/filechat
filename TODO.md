# High-priority

* Improve the assistant module - look into agentic flow / agents, assistants - some easy way to include chat history
* Store chat history
* Accessibility
* Remote logging
* Automated testing
* Add Google Drive file metadata into vector store

# Low-priority

* Server-side validation checks file type, but it should validate all the way through successful parsing into text chunks. File type can surely be spoofed. Watch out for errors from PDFLoader in VectorStore.ts
* Use chunked+resumable upload instead of default form POST to handle larger uploads
* Add more meaningful loading to form submission - progress bar / status text
* Make UI light/dark theme compatible
* Don't create Google Drive client in module root?
* Azure AI search local emulator
* Make Google Drive file download multi-threaded