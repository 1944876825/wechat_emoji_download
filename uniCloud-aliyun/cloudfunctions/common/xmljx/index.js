var xml2js = require('xml2js');

module.exports = async (xml) => {
	// 文本消息
	let obj = await xml2js.parseStringPromise(xml, { explicitArray: false })
	return obj.xml;
}