import { Html, Head, Main, NextScript } from "next/document";
import nprogress from "nprogress";

export default function Document() {
  return (
    <Html>
      <Head>
        <link
          rel="stylesheet"
          href={`https://cdnjs.cloudflare.com/ajax/libs/nprogress/${nprogress.version}/nprogress.min.css`}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
