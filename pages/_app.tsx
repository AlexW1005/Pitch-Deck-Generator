/**
 * QuickBuy - Lazard-style Buy-Side Pitch Generator
 * Custom App Component
 */

import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>QuickBuy — Lazard-style Buy-Side Pitch Generator</title>
        <meta name="description" content="Generate professional buy-side stock pitch decks with auto-filled financial data" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}





