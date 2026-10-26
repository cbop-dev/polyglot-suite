export function mylog(msg: any, debugOn: boolean = false, thelevel: number = 0) {
	if (debugOn) {
		console.log(msg);
	}
}
