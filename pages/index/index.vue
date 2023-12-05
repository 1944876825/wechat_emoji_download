<template>
	<view class="content">
		<block v-if="is_bind">
			<view class="" style="font-size: 14px;padding: 20rpx;">
				欢迎使用下载表情包小程序，此小程序目的在于帮助家人们方便下载微信表情包，完全免费，但是使用前需要你先前往微信公众号绑定身份。
			</view>
			<view class="">
				<uni-steps :options="step_list" active-color="#007AFF" :active="step_active" direction="column" />
			</view>
			<view @tap="copyId(loginData._id)" class="" style="text-align: center;font-size: 14px;padding: 20rpx;font-weight: 600;">
				密码：{{loginData._id ? 'bind-'+loginData._id : '获取失败'}}（点击复制）
			</view>
		</block>
		<block v-else>
			<view v-if="emojiList.length>0" class="flex-row flex-wrap" style="padding: 0 15rpx;">
				<view class="emoji_item"
					v-for="(emoji, index) in emojiList"
					:key="index"
					@tap="showEmoji(index)"
					@longpress="delEmoji(index, emoji)"
					style="width: 160rpx;height: 160rpx;padding: 10rpx;">
					<image :src="emoji" style="width: 100%;height: 100%;" mode="aspectFill"></image>
				</view>
			</view>
			<view class="" style="text-align: center;font-size: 14px;margin-top: 15rpx;" v-else>
				还没有表情包呢，快去公众号上传叭
			</view>
		</block>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				emojiList: [],
				loginData: {},
				is_bind: false,
				is_csh: false,
				step_active: 0,
				step_list: [
					{
						title: '关注公众号',
						desc: '微信右上角搜索：旧梦影视'
					},
					{
						title: '对公众号发送最下方密码',
						desc: '点击可以复制'
					}, 
					{
						title: '发送表情包',
						desc: '对公众号发送表情包，回到小程序即可看到发送的表情包'
					}, 
					{
						title: '下载表情包',
						desc: '点击表情进行预览，长按进行保存图片'
					},
				]
			}
		},
		onLoad() {
			uni.startPullDownRefresh()
		},
		onShow() {
			if (this.is_csh) {
				if (!this.loginData) {
					this.login()
				}
			}
		},
		onPullDownRefresh() {
			if (!this.loginData._id) {
				this.login()
			} else {
				this.getEmojiList()
			}
			setTimeout(function() {
				uni.stopPullDownRefresh();
			}, 500);
		},
		methods: {
			delEmoji(index, url) {
				uni.showModal({
					content: '是否删除？',
					success:res=>{
						if (res.confirm) {
							uniCloud.callFunction({
								name: 'user_emoji_del',
								data: {
									_id: this.loginData._id,
									url
								}
							}).then(res => {
								if (res.result.updated > 0) {
									this.emojiList.splice(index, 1);
								} else {
									uni.showToast({
										icon:'none',
										title:'删除失败'
									})
								}
							})
						}
					}
				})
			},
			copyId(e) {
				uni.setClipboardData({
					data: 'bind-' + e
				})
			},
			showEmoji(index) {
				uni.previewImage({
					urls: this.emojiList,
					current: index
				})
			},
			login() {
				let loginData = uni.getStorageSync('loginData');
				if (loginData.mp_openid) {
					this.is_bind = false;
					this.loginData = loginData;
					this.getEmojiList();
					return;
				}
				uni.login({
					provider: 'weixin', //使用微信登录
					success: loginRes=> {
						if (loginRes.code) {
							uniCloud.callFunction({
								name: 'wxLogin',
								data: {
									code: loginRes.code
								}
							}).then(res => {
								this.is_csh = true;
								if (res.result.data.openid) {
									this.loginData = res.result.data;
									uni.setStorageSync('loginData', res.result.data);
									if (res.result.data.mp_openid) {
										this.getEmojiList();
									} else {
										if (res.result.data._id) {
											this.is_bind = true;
										} else {
											uni.showToast({
												icon: 'none',
												title: '登录失败 -4'
											})
										}
									}
								} else {
									uni.showToast({
										icon: 'none',
										title: '登录失败 -3'
									})
								}
							}).catch(err => {
								this.is_csh = true;
								uni.showToast({
									icon: 'none',
									title: '登录失败 -2'
								})
							})
						} else {
							uni.showToast({
								icon: 'none',
								title: '登录失败 -1'
							})
						}
					},
					fail() {
						this.is_csh = true;
						uni.showToast({
							icon: 'none',
							title: '登录失败 -5'
						})
					}
				});
			},
			getEmojiList() {
				uniCloud.callFunction({
					name: 'user_emoji_list',
					data: {
						'_id': this.loginData._id
					},
					success:res => {
						this.is_bind = false;
						this.emojiList = res.result;
						uni.showToast({
							icon:'none',
							title: '获取成功'
						})
					},
					fail:err=>{
						uni.showToast({
							icon:'none',
							title: '获取失败'
						})
					}
				})
			}
		}
	}
</script>

<style>
</style>
