<h1 align="center">File Chat</h1>

## About the project

This is a proof-of-concept demo by Shamik Ganguly for bring-your-own-docs, public retrieval-augmented generation.

## Try it out

[![demo-screenshot]](https://filechat.shamgang.com)

[https://filechat.shamgang.com](https://filechat.shamgang.com)


Disclaimers:
* To keep the demo low-cost, file sizes are limited to 1 MB and there is a session lifetime of 24 hours.
* Chat history implementation is out of scope - I may implement it later :)
* The vector store has a 50 MB limit which may be reached with heavy use. Storage is cleared every day, so try again tomorrow if you encounter errors.
* This is not a secure demo. Do not upload sensitive information.

## Built With

* [![OpenAI]][OpenAI-url]
* [![Next.js]][Next-url]
* [![React.js]][React-url]
* [![Tailwind.css]][Tailwind-url]
* [![shadcn]][shadcn-url]
* [![TypeScript]][TypeScript-url]
* [Azure Functions](https://azure.microsoft.com/en-us/products/functions)
* [Azure Web PubSub](https://azure.microsoft.com/en-us/products/web-pubsub)
* [Azure Static Web Apps](https://azure.microsoft.com/en-us/products/app-service/static)
* [Cursor](https://cursor.sh/)

<!-- MARKDOWN LINKS & IMAGES -->
[demo-screenshot]: screenshot.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react
[React-url]: https://reactjs.org/
[Tailwind.css]: https://img.shields.io/badge/Tailwind-20232A?style=for-the-badge&logo=tailwindcss
[Tailwind-url]: https://tailwindcss.com/
[OpenAI]: https://img.shields.io/badge/OpenAI-20232A?style=for-the-badge&logo=openai
[OpenAI-url]: https://openai.com/
[shadcn]: https://img.shields.io/badge/shadcn-20232A?style=for-the-badge&logo=shadcnui
[shadcn-url]: https://ui.shadcn.com/
[TypeScript]: https://img.shields.io/badge/TypeScript-20232A?style=for-the-badge&logo=typescript
[TypeScript-url]: https://www.typescriptlang.org/