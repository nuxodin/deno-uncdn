import { serveFile } from "https://deno.land/std/http/file_server.ts";

export class Uncdn {
    constructor(options){
        this.dir = options.dir;
        this.rootUrl = options.rootUrl || '/uncdn/';
    }
    async cdn2path(url){
        var name = encodeURIComponent(url);
        var path = this.dir+'/'+name;
        try {
            await Deno.stat(path);
            return path;
        } catch (e) { // not found
            const response = await fetch(url);
            let contents = await response.text();

            /*
            todo: parseContent to find linked files: // dangerous!!!
            todo?: use a options to enable/disable
            js:
            */
            contents = contents.replace(/(import .+ from ["'])(http[^"]+)(["'])/g, (full, $1, $2, $3)=>{
                return $1 + this.cdn2url($2) + $3;
            });
            /* */

            Deno.writeFile(path, new TextEncoder().encode(contents) );
            return path;
        }
    }
    cdn2url(url) {
        this.cdn2path(url);
        return this.rootUrl+url;
    }
    async serve(req) {
        if (!req.url.startsWith(this.rootUrl)) return false;
        const cdnUrl = req.url.substr(this.rootUrl.length);
        var name = encodeURIComponent(cdnUrl);
        var path = this.dir+'/'+name;
        try {
            const response = await serveFile(req, path);
            response.headers.set("content-type", 'text/javascript');
            req.respond(response);
            return true;
        } catch (e) { // not found
            await this.cdn2path(cdnUrl) // dangerous!!!!
            return false;
        }

    }
}
