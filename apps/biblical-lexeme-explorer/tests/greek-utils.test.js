import {test,expect} from 'vitest'
import { GreekUtils as gu} from '$lib/utils/greek-utils'


test('test',()=>{
    expect(true).toBe(true);
})


test('remove diacritics test',()=>{
    const gMap = {
        "ᾤ": "ω",
        "[τὰ": "τα",
        "με]γάλα": "μεγαλα",
        "⸂⸆⸃": "",
        "⸆": "",
        "[θεός]": "θεοσ"
    };
    for (const [g1,g2] of Object.entries(gMap)) {
        expect(gu.plainGreek(g1)).toBe(g2);
    }
})


