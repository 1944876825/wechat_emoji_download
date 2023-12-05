'use strict';
const db = uniCloud.database();
const user = db.collection('user');
const dbCmd = db.command;

exports.main = async (event, context) => {
	const {_id=''} = event;
	if (!_id) {
		return;
	}
	const userInfo = await user.doc(_id).get();
	return userInfo.data[0].emojiList;
};