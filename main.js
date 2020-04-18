
export class uncdn {
    constructor(options){
        this.dir = options.dir;
    }
    url2path(url){
        var name = encodeURIComponent(url);
        var path = this.dir+'/'+name;
        try {
            fileInfo = await Deno.stat(path);
            return path;
        } catch (e) { // not found
            const response = await fetch(url);
            var contents = response.text();
            Deno.writeFile(path, contents);
            return path;
        }
    }
}
