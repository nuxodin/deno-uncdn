import {serve} from "https://deno.land/std@v0.42.0/http/server.ts";
import {Uncdn} from "../main.js";

var uncdn = new Uncdn({
    cacheDir: await Deno.makeTempDir({prefix:'uncdn_test'}),
});

console.log('server on port 94');

for await (let req of serve(":94")) {
    var found = await uncdn.serve(req);
    if (!found) {
        const headers = new Headers();
        headers.set("content-type", "text/html; charset=utf-8");
        req.respond({
            headers: headers,
            body:`
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <script type=module>
                        import {render, html, svg} from '${uncdn.url('https://unpkg.com/uhtml@1.10.0/esm/index.js?module')}';
                        render(document.body, html\`<h1>Hello 👋 uncdn</h1>\`);
                    </script>
                <body>
                reload some times to wait for files copied from cdn
                </body>
            </html>`
        })
    }
}
