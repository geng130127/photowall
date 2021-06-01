/**
 * @Description: APP交互相关功能（注意：需要使用第三方库 crypto-js）
 * @author GengXuYang
 * @date 2021/1/11
*/

appInteractive = (function (){
  'use strict';

  /**
   * 获取到的客户端传递过来的参数
   * @type {{preid: string, use_traditional: string, app_version: string, user_id: null, ext_json: {}, login_token: string, platform: string}}
   */
  const appParameters = {
    login_token: '',
    preid: '',
    app_version: '',
    platform: '',
    user_id: null,
    use_traditional: '',
    ext_json: {}
  }

  const setAppParameters = function (params){
    appParameters.login_token = params.login_token
    appParameters.preid = params.preid
    appParameters.app_version = params.app_version
    appParameters.platform = params.platform
    appParameters.user_id = params.user_id
    appParameters.use_traditional = params.use_traditional
    appParameters.ext_json = params.ext_json
  }

  /**
   * 判断是否为JSON字符串
   * @param str 字符串
   * @return {boolean}
   */
  const checkIsJSON = function (str) {
    if (typeof str === 'string') {
      try {
        var obj = JSON.parse(str)
        if (typeof obj === 'object' && obj) {
          return true
        } else {
          return false
        }
      } catch (e) {
        return false
      }
    }
    return false
  }

  /**
   * 获取URL地址中的参数
   * @param name
   * @return {string|null}
   */
  const getQueryString = function(name) {
    const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    const r = window.location.search.substr(1).match(reg);
    if (r != null)
      return decodeURI(r[2])
    return null
  }

  /**
   * 解密APP传递过来的参数
   * @param ext_json 额外参数
   */
  const encodeAppParam = function(ext_json) {
    try {
      const de_str = decodeURIComponent(ext_json)
      const json_str = CryptoJS.enc.Base64.parse(de_str).toString(CryptoJS.enc.Utf8)

      if (checkIsJSON(json_str)) {
        return JSON.parse(json_str)
      }
      return {}
    } catch (error) {
      console.log(error)
      return {}
    }
  }

  /**
   * 获取APP从URL传递的参数
   * @return {{preid: *, use_traditional: *, app_udid: *, app_version: *, user_id: *, ext_json: {}, login_token: *, platform: *}}
   */
  const getAppParameters = function() {
    const login_token = getQueryString('login_token')
    const preid = getQueryString('preid')
    const app_version = getQueryString('app_version')
    const platform = getQueryString('platform')
    const user_id = getQueryString('user_id')
    const use_traditional = getQueryString('use_traditional')
    const ext_json = getQueryString('ext_json')
    const extJson = ext_json ? encodeAppParam(ext_json) : {}
    const params = {
      login_token: login_token,
      preid: preid,
      app_version: app_version,
      platform: platform,
      user_id: user_id,
      use_traditional: use_traditional,
      ext_json: extJson
    }
    setAppParameters(params)
  }

  /**
   * APP直接调用该方法传递的参数
   * @param login_token
   * @param preid
   * @param app_version
   * @param platform
   * @param user_id
   * @param use_traditional
   * @param ext_json
   * @return {{}}
   */
  window.setParametersByApp = function(login_token, preid, app_version, platform, user_id, use_traditional, ext_json) {
    try {
      const params = {
        login_token: login_token || '',
        preid: preid || '',
        app_version: app_version || '',
        platform: platform || '',
        user_id: user_id || null,
        use_traditional: use_traditional || '',
        ext_json: ext_json ? encodeAppParam(ext_json) : {}
      }
      setAppParameters(params)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * APP分享参数处理
   * @param paramsStr
   * @return {string}
   */
  const appShareParamsEncrypt = function(paramsStr) {
    let str = paramsStr
    if(Object.prototype.toString.call(paramsStr) !== '[object String]') {
      str = JSON.stringify(paramsStr)
    }
    const encodedWord = CryptoJS.enc.Utf8.parse(str)
    const base64_str = CryptoJS.enc.Base64.stringify(encodedWord)
    const en_str = encodeURIComponent(base64_str)
    return en_str
  }

  /**
   * 挂载客户端使用的分享方法
   * @param params
   */
  const appShareUsing = function(params = {}) {
    window.appGetShareInfo = function() {
      const content = {
        title: params.title || '旅法师营地分享',
        content: params.content || '旅法师营地分享',
        image: params.image || 'https://static.iyingdi.com/yingdiWeb/images/adv/yingdiAPPDownload/down_app.png',
        url: params.url || 'https://mob.iyingdi.com/'
      }
      return appShareParamsEncrypt(JSON.stringify(content))
    }
  }

  return {
    getAppParameters: getAppParameters,
    appShareParamsEncrypt: appShareParamsEncrypt,
    appShareUsing: appShareUsing,
    appParameters: appParameters
  }
})()
