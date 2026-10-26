function cleanString(str) {
    return str.replace(/[\s_]+/g, ' ').trim();
}
function splitBookChap(string) {
    const matches = cleanString(string).match(/^(([1-3]+ +)?[a-zA-Z]+)( +([0-9a-z-]+))?$/);
    let theBook = null, theChap = null;

    if (matches && matches.length >= 5) { //got chapter
        theBook = matches[1];
        theChap = matches[4] ? matches[4] : null;
    }
    else if (matches && matches[1]) {//just a book
        theBook = matches[1];
    }
    return { book: theBook, chap: theChap }
}
console.log('Deuteronomy 1:', splitBookChap('Deuteronomy 1'));
console.log('Deut 1:', splitBookChap('Deut 1'));
console.log('Deuteronomy:', splitBookChap('Deuteronomy'));
console.log('1 Sam 2:', splitBookChap('1 Sam 2'));
