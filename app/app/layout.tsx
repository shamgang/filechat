import type { Metadata } from "next";
import "./globals.css";

import { getRandomBackgroundImageUrl } from '@/lib/BackgroundImage';

export const metadata: Metadata = {
  title: "File Chat",
  description: `Bring your own files and chat about them with a \
  Large Language Model (LLM) / Generative Pre-trained Transformer (GPT) \
  using Retrieval Augmented Generation (RAG). Created by Shamik Ganguly.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const backgroundImg: string = getRandomBackgroundImageUrl();

  const backgroundStyle = {
    backgroundImage: `url(${backgroundImg})`
  };

  return (
    <html lang="en">
      <body>
        <div className="h-screen w-screen bg-cover bg-center" style={backgroundStyle}>
          {children}
        </div>
      </body>
    </html>
  );
}
