import { serveFile } from "https://deno.land/std/http/file_server.ts";

export class Uncdn {
    constructor(options){
        this.dir = options.dir;
        this.rootUrl = options.rootUrl || '/uncdn/';
    }
    url(url) {
        this._ensure(url);
        return this.rootUrl+url;
    }
    async serve(req) {
        if (!req.url.startsWith(this.rootUrl)) return false;
        const cdnUrl = req.url.substr(this.rootUrl.length);
        try {
            var path = this._path(cdnUrl);
            const response = await serveFile(req, path);
            response.headers.set("content-type", 'text/javascript');
            req.respond(response);
            return true;
        } catch (e) { // not found
            await this._ensure(cdnUrl) // dangerous!!!!
            return false;
        }
    }

    /* private */
    async _ensure(url){
        var path = this._path(url);
        try {
            await Deno.stat(path);
        } catch (e) { // not found
            const response = await fetch(url);
            let contents = await response.text();
            /*
            todo: parseContent to find linked files: // dangerous?
            todo?: use a options to enable/disable
            js:
            */
            contents = contents.replace(/(import .+ from ["'])(http[^"]+)(["'])/g, (full, $1, $2, $3)=>{
                return $1 + this.url($2) + $3;
            });
            /* */
            Deno.writeFile(path, new TextEncoder().encode(contents) );
        }
    }
    _path(url) {
        return this.dir + '/' + encodeURIComponent(url); // is it save to use encodeURIComponent?
    }
}
