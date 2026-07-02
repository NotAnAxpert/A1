import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          #root, body, html { height: 100%; }
          body { overflow: hidden; margin: 0; padding: 0; }
          #root { display: flex; }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
