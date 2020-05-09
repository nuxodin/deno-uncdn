import { serveFile } from "https://deno.land/std@v0.42.0/http/file_server.ts";

/** Class for translating cdn => locally */
export class Uncdn {
    /** Create a uncdn-manager
     * @param options options:
     * @param options.cacheDir Where files are cached
     * @param options.rootUrl
     * @param options.openProxy proxy all requests: really dangerous!
     */
    constructor(options){
        this.cacheDir = options.cacheDir;
        this.rootUrl = options.rootUrl || '/uncdn/';
    }
    /**
     * @param {string} url - rewrites the url for fetching locally
     * @param {*} options
     */
    url(url, options={}) {
        const localPart = this._urlToLocalPart(url, options);
        //return this.rootUrl + url;
        return this.rootUrl + localPart;
    }
    async requestToResponse(req) {
        if (!req.url.startsWith(this.rootUrl)) return false;
        let cdnUrl = req.url.substr(this.rootUrl.length);
        try {
            var path = this._path(cdnUrl);
            const response = await serveFile(req, path);
            response.headers.set("content-type", 'text/javascript');
            return response;
        } catch (e) { // not found
            if (this.options.openProxy) {
                console.warn('warning, this is very dangerous! deactivate with option openProxy:false  loading: '+cdnUrl);
                await this._ensure(cdnUrl, {/* options? */}); // dangerous!!!!
            }
            return false;
        }
    }
    async serve(req) {
        var resp = this.requestToResponse(req);
        if (!resp) return false;
        //req.response(resp); // second argument?????
        req.response(resp, {}); // zzz
    }
    _urlToLocalPart(url, options) {
        let localPart = url; //.replace(/https:\/\//,'');
        if (options.bundle) localPart = localPart.replace(/\.js$/,'.bndl.js');
        if (options.minify) localPart = localPart.replace(/\.js$/,'.min.js');
        return localPart;
    }
    /* private */
    async _ensure(url, options){
        var path = this._path( this._urlToLocalPart(url, options) );
        try {
            await Deno.stat(path);
        } catch (e) { // not found
            let contents;
            if (options.bundle) { // as a bundle
                let maybeDiagnostics1;
                [maybeDiagnostics1, contents] = await Deno.bundle(url);
            } else {
                const response = await fetch(url);
                contents = await response.text();
                contents = contents.replace(/(import .+ from ["'])(http[^"]+)(["'])/g, (full, $1, $2, $3)=>{
                    return $1 + this.url($2) + $3;
                });
            }
            /*
            todo: parseContent to find linked files: // dangerous?
            todo?: use a options to enable/disable
            js:
            */
            Deno.writeFile(path, new TextEncoder().encode(contents) );
        }
    }
    _path(url) {
        return this.cacheDir + '/' + encodeURIComponent(url); // is it save to use encodeURIComponent?
    }
}
