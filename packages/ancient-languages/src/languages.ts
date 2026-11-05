
export class Languages {


    static LANGUAGE_CODES: Record<string,{name:string,short:string}>={
        'grc':{name:"Greek",short:"Gk"},
        'hbo':{name:"Hebrew",short:"Heb"},
        'eng':{name:"English",short:"Eng"},
        'lat':{name:"Latin",short:"Lat"},
        'syr':{name:"Syriac",short:"Syr"},

    }
    /**
     * 
     * @param code 
     * @returns name of the associated language, or empty string if none found.
     */
    static getNameFromCode(code:string){
        return Object.hasOwn(this.LANGUAGE_CODES, code) ?
            this.LANGUAGE_CODES[code]?.name
            :
            '';
    }

    /**
     * 
     * @param code 
     * @returns name of the associated language, or empty string if none found.
     */
    static getShortNameFromCode(code:string){
        return Object.hasOwn(this.LANGUAGE_CODES, code) ?
            this.LANGUAGE_CODES[code]?.short
            :
            '';
    }

}