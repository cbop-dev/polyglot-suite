import { mylog } from "$lib/env/env.js";
import { LexQuery, LexQueryFilter } from "$lib/components/LexQuery.svelte";

export class LexAppOptions {
    static paramsMap ={

        panel: {type:'str', category: 'view'},
        sections:{type:'intArray',split:',',category:"request"},
        //refs:{type:'strArray',split:';',category:"request"},
        refs:{type:'str',category:"request"},
        exclude: {type:'intArray',split:',',category:"request"},
        restrict: {type:'intArray',split:',',category:"request"},
                /*
            hideNonPrimary: { type: 'boolean', category: 'view'},
            focusOn: { type: 'boolean', category: 'view'},
            hideNonPrimarySolos: { type: 'boolean', category: 'view'},
            unique: { type: 'boolean', category: 'view'},
            identical: { type: 'boolean', category: 'view'},
            sort: { type: 'boolean', category: 'view'},
            highlightOnClick: { type: 'boolean', category: 'view',noURL:true},
            hideApp: { type: 'boolean', category: 'view'},
            lexes: {type: 'intArray', split: ",", category: 'view'},
            similarPhrases: {type: 'boolean', category: 'view'},
            exactPhrases: {type: 'boolean', category: 'view'},
            selectedGospelIndex: {type:"int",default:0, category: 'view'},
            greekStrings: {type: 'strArray', split: "|", category: 'view'},
            tab: {type:"int",default:0, category: 'request'},
            mode: {type:"int",default:0, category: 'request'},            
            pericopes: {type: 'intArray', split: ",", category: 'request'},
            sections: {type: 'intArray', split: ",", category: 'request'},   
            columns: {type: 'strArray', split: "|", category: 'request'},
            batch: {type: 'strArray', split:"^", category: 'request'},
            nt: {type:'str', category: 'request', default:'sblgnt'},           
            fromURL: {type:'boolean', category: 'request',noURL:true},
            menuOpen: {type:'boolean', default: false, category: 'view',noURL:true},
            showLookup: {type:'boolean', default: false, category: 'view',noURL:true},
            hideSecondary: {type:'boolean', default: false, category: 'view',noURL:false},
            lexInfoClick:{ type: 'boolean', category: 'view',noURL:true},
            page:{ type: 'int', category: 'view',noURL:false,default: 0},
            showEverything:{ type: 'boolean', category: 'view',noURL:true,default: false},
            ignoreWords:{ type: 'intArray', category: 'view',noURL:false,default: ignoreWords},
        */
    }

    /**
     * @param {URLParam[]} urlParams 
     * @returns {LexAppOptions}
     */
    static fromURLParams(urlParams){
//        mylog(`fromURLParams: [${urlParams.join(',')}]`,true);
        const options=new LexAppOptions();
        let foundParams=false;
        for (const param of urlParams){
            if(Object.hasOwn(LexAppOptions.paramsMap,param.name)){
                const paramDetails=LexAppOptions.paramsMap[param.name];
                if(paramDetails.category=='view'){
                    options.view[param.name]=param.value;
                    if (false && !options.request.fromURL){
                        options.request.fromURL=true;
                    }
                }
                else if(paramDetails.category=='request'){
                    options.request[param.name]=param.value;
                    if (!options.request.fromURL){
                        options.request.fromURL=true;
                    }
                }
            }
        }

        return options;
    }
    
    view={};
    request={};
    reset(){
        //const theCopy=new LexAppOptions();
        //this.view=copyObject(theCopy.view);
        //this.request=copyObject(theCopy.request);
        for (const [propName,row] of Object.entries(LexAppOptions.paramsMap)){
            this.resetProp(propName);
        }
    }

    getPropVal(propName){
       // mylog(`In getPropVal(${propName})`,true)
        if (Object.hasOwn(LexAppOptions.paramsMap,propName)){
            const row = LexAppOptions.paramsMap[propName];
            if (row.category=='view' && Object.hasOwn(this.view,propName)){
                //mylog(`getPropVal('${propName}') got a val!'`)
                return this.view[propName];
                
            }
            else if (row.category=='request' && Object.hasOwn(this.request,propName)){
                //mylog(`In request section`)
                return this.request[propName];
            }
            else{
                //mylog(`row type == ${row.type} but got no value!`)
                return null;
            }
        }
        else{
        //    mylog(`could not find propname '${propName}'`);
            return null;
        }
    }

    /**
     * 
     * @param {string} propName 
     * @returns true if the property was actually reset
     */
    resetProp(propName){
        let reset=false;
        let origVal=this.getPropVal(propName);
       // mylog(`in resetProp(${propName}), origVal='${origVal}'`)
        if(Object.hasOwn(LexAppOptions.paramsMap,propName)){
            const row=LexAppOptions.paramsMap[propName];
            
            
            let theDefault=Object.hasOwn(row,'default') ? row.default : null;

            if(theDefault==null ){
                if(row.type=='int'){
                    theDefault=0
                }
                else if(row.type=='boolean'){
                    theDefault=false;
                }
                else if(row.type=='str'){
                    theDefault=''
                }
               /* else if (Object.keys(this.view).includes(propName) && this.view[propName] && this.view[propName]?.length){ //an array type
                    //this.view[propName].length=0;
                }*/
                

            }

            if(row.category=='view'){
                if (theDefault!=null) {
                    this.view[propName]=theDefault;
                    reset=true;
                }
                else if (row.type.includes('Array')){
                    if (this.view[propName].length){
                        this.view[propName].length=0;
                        reset = true;
                    }

                }

                
            }
            else if(row.category=='request'){
                if (theDefault != null) {
                    this.request[propName]=theDefault;
                    reset=true;
                }
                else if (row.type.includes('Array')){
                    if (this.request[propName].length){
                        this.request[propName].length=0;
                        reset=true;
                    }

                }
            }
        //    mylog(`myOptions.resetProp('${propName}'): reset from '${origVal}', to: '${theDefault}'`)
        }
        else{
            //mylog(`myOptions.resetProp('${propName}'): not found`)
        }

        return reset;
        
    }
    constructor(){
        Object.entries(LexAppOptions.paramsMap).forEach(([name,row])=>{
            let val=row.default ? row.default : null;

            if(!val){
                if(row.type=='int'){
                    val=0
                }
                else if(row.type=='boolean'){
                    val=false;
                }
                else if(row.type=='str'){
                    val=''
                }
                else{//one of the array types.
                    val=[]
                }

            }

            if(row.category=='view'){
                this.view[name]=val;
            }
            else if(row.category=='request'){
                this.request[name]=val;
            }
        })
        
    }

    /**
     * @param lexQuery {LexQuery}
     * @returns {string}
     */
    generateURI(query=new LexQuery()){
        if (query.sections?.length){
			this.request.sections = query.sections;
		}
		else if(query.refsText?.length){
			this.request.refs = query.refsText;
		}
		
        
        
        
        const copyProps=//target, src
            {'sections':'sections', 'refs':'refs'}

        mylog(`generateURL. exclude=${query.exclude?.join(',')}`, true);
		if (query?.exclude?.length) this.request.exclude=query.exclude
		if (query?.restrict?.length) this.request.restrict=query.restrict
        //const baseurl = window.location.protocol  + "//" + window.location.host + "/";
        /**
         * @type {string[]} viewUri
         */
        const validProps=Object.entries(LexAppOptions.paramsMap).filter(([k,v])=>!v.noURL).map(([k,v])=>k);
        const urlParams= new URLSearchParams();

        [...Object.entries(this.view),...Object.entries(this.request)].filter(([k,v])=>validProps.includes(k))
        .forEach(([name,val])=> {
            //const pRow = LexAppOptions.paramsMap[name];
            let str=''
        
            const urlParamRow=LexAppOptions.paramsMap[name];
            let valStr=val;
            if(urlParamRow.type=='intArray'||urlParamRow.type=='strArray'){
                valStr=val.join(urlParamRow.split);
            }
            else if(urlParamRow.type=='boolean'){
                valStr= val ? "1" : ""
            }//otherwise, it's a string, leave as is.
            
            if(name && val && valStr){
                urlParams.set(name,valStr);
                //mylog(`Got url param: '${name}'='${valStr}'`);
            }
            else {
                //mylog(`Couldn't add url param for name:'${name}', strVal: '${valStr}'`);
            }
            return str;
        });        
//        mylog(`generateURI() returning: '${theUris}'`)        
        return urlParams.size ? "?" + urlParams.toString() : '';
    }
    
    generateURL(query=new LexQuery()){

        const baseurl = window.location.protocol + '//' + window.location.host + window.location.pathname 
        
        return baseurl + this.generateURI(query);
    }
    /**
     * 
     * @returns {LexAppOptions}
     */
    copy(){
        const theCopy=new LexAppOptions();
        theCopy.view=copyObject(this.view);
        theCopy.request=copyObject(this.request)
        return theCopy;
    }

    softReset(){
    }
}

function copyObject(obj){
    const copy={};
    Object.entries(obj).forEach(([k,v])=>{
        copy[k]=v;

    });
    return copy;
}


export class URLParam {
  /**
   * 
   * @param {string} name 
   * @param {any} value 
   * @param {string} type 
   * @param {string} delimiter 
   */
  constructor(name='',value='', type='str',delimiter=''){
    this.name=name;
    this.type='str';
    this.delimiter='';
    this.value=URLParam.strToObj(value,type,delimiter);
  }

  /**
   * 
   * @param {string} strValue 
   * @param {string} type 
   * @param {string} delimiter 
   * @returns 
   */
  static strToObj(strValue,type='str',delimiter=''){
    let obj=null
    if (type == 'str'){
        obj=strValue;
    }
    else if(type=='boolean'){
        obj= (typeof strValue =='string' && (strValue=="1" || strValue?.toLocaleLowerCase()=="true"|| strValue?.toLocaleLowerCase()=="t")) ? true : false;
    }
    else if(type=='int'){
        obj=parseInt(strValue);
    }
    else if(type=='intArray'){
        obj=strValue.split(delimiter).map((s)=>parseInt(s));
    }
    else if(type=='strArray'){
        obj=strValue.split(delimiter);
    }
    return obj;
}
  

  toURLstring(){
    return this.name+'='+ (this.delimiter ? this.value.join(this.delimiter) : this.value);
  }

}

/**
 * 
 * @param {URLSearchParams} searchParamsObj 
 * @returns {URLParam[]}
 */
export function getRequestParamsObj(searchParamsObj){
//    mylog(`getRequestParamsObj=${searchParamsObj.toString()}`,true);
    /**
     * @type {URLParam[]}
     */
    const paramObjs=[];
    Object.entries(LexAppOptions.paramsMap).forEach(([paramName,paramDetails])=>{

        if(searchParamsObj.has(paramName)){
//            mylog(`getReqParmsObj() got param: '${paramName}:${searchParamsObj.get(paramName)}'`,true);
            const pObj=new URLParam(paramName,searchParamsObj.get(paramName),paramDetails.type, 
                paramDetails?.split || '');
            paramObjs.push(pObj);
//            mylog(`got paraObj :${Object.entries(pObj).map(([k,v])=>k + ":" + v).join("; ")}`,true);
//            mylog(`pushed paramObj: ${pObj.toString()}`,true);
        }
        else{
//            mylog(`did not get param name: ${paramName}`,true);
        }

    })

    return paramObjs;
}

/**
 * 
 * @param {URLParam[]} params 
 * @returns 
 */
export function generateURL(params){
    const baseurl = window.location.protocol  + "//" + window.location.host + "/";
    
    const uri=params.reduce((partialURI,p)=>`${partialURI}&${p.toURLstring()}`,"?");
    return baseurl + uri;

   
}
