'use strict';
const db = uniCloud.database();
const user = db.collection('user');
const dbCmd = db.command;

exports.main = async (event, context) => {
	const {_id='', url=''} = event;
	if (!_id || !url) {
		return;
	}
	const res = await emoji_del(_id, url);
	const delres = await uniCloud.deleteFile({
		fileList: [url]
	});
	return res;
};

async function emoji_del(_id, url) {
	const res = await user.doc(_id).update({
		emojiList: dbCmd.pull(url)
	});
	return res;
}
