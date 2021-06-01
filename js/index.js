$(function () {
    $('html,body').animate({scrollTop: 0}, 0);
    const destroyBubble = function (event) {
        event.preventDefault();
        if (event && event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.cancelBubble = true;
        }
    }
    appInteractive.getAppParameters()
    console.log(appInteractive.appParameters)
    const apiUrl = `https://activity-api-test.iyingdi.com`;
    // const apiUrl = `https://activity-api.iyingdi.com`;
    const secret_key =`7b73cc31d7fd4250da2facf7ef5c7235`
    // ajax请求公共header
    const ajaxHeader = {
        'Login-Token': 'nologin',
        'Activity-Id':'picture_wall_2021'
    }

    const sortObjByASCII = function(params) {
        const keysArr = Object.keys(params).sort()
        const sortObj = {}
        for (const i in keysArr) {
            sortObj[keysArr[i]] = params[keysArr[i]]
        }
        return sortObj
    }
    const apiParams = function (params) {
        ajaxHeader["Login-Token"] = appInteractive.appParameters.login_token || 'nologin'
        params['timestamp'] ? delete params['timestamp'] : null
        params['sign'] ? delete params['sign'] : null
        params['timestamp'] = Date.parse(new Date()) / 1000
        const paramData = sortObjByASCII(params)
        let sign = ''
        for (const item in paramData) {
            sign += `${item}=${paramData[item]}&`
        }
        sign = `${sign}key=${secret_key}`
        paramData.sign = CryptoJS.MD5(sign).toString()
        return paramData
    }
    const login = function () {
        const $a = document.createElement('a')
        $a.setAttribute('href', 'wanxiu://innerlink?type=weblogin')
        $a.click()
    }
    appInteractive.appShareUsing({
        title: '营地图片墙活动进行中！',
        content: '夏日好风光，快来营地晒出你的美图',
        image: 'https://pic.iyingdi.com/yingdi_activity/photowall/zz-share.jpg?v=' + Date.parse(new Date()),
        url: location.origin + location.pathname
    })

    // region 埋点初始化
    window.AnalysysAgent.init({
        appkey: '01cfd55a0542cd89', // APPKEY
        uploadURL: 'https://yingdidatacollect.gaeadata.com', // 上传数据的地址,
        debugMode: 2,
        auto: true,
        autoProfile: true
    })
    const AgentCommonPros = {
        user_id: (appInteractive.appParameters.user_id || 0),
        platform: appInteractive.appParameters.platform
    }
    window.AnalysysAgent.alias(appInteractive.appParameters.user_id || 0)
    window.AnalysysAgent.profileSet(AgentCommonPros)
    window.AnalysysAgent.registerSuperProperties(AgentCommonPros)

    // endregion

    // region 列表操作相关（滚动加载，点赞，删除，查看大图）

    // 图片高度集合
    let imgHeights = []
    // 图片集合
    let allList = []
    // 左图片列表
    let leftList = []
    // 右图片列表
    let rightList = []
    // 是否继续滚动
    let scrollLoading = false
    // 卡片中的信息高度
    let cardInfoHeight = Number($('html').css('fontSize').replace('px', '')) * 1.75

    // 接口参数
    let listParams = {
        timestamp: 0,
        page: 1,
        size: 10,
        version: 0,
        type: 1 // 1:最热；2:最新
    }
    let likeParams = {
        type: -1,
        timestamp: 0,
        picture_id: 0,
    }
    let deleteParams = {
        timestamp: 0,
        picture_id: 0,
    }
    let uploadParams = {
        timestamp: 0,
        resource: 0,
    }

    /**
     * 列表加载动画
     * @param type add: 添加动画 delete: 删除动画
     */
    const listLoadingStyle = function (type) {
        if (type === 'add') {
            const html = `
                <div class="list-loading">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `
            $('.column-container').after(html)
            return false
        }
        $('.container .list-loading').remove()
    }
    // 获取数据方法
    const getItemsList = function () {
        imgHeights = []
        allList = []
        leftList = []
        rightList = []
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: `${apiUrl}/picture/list`,
                headers: ajaxHeader,
                data: listParams,
                datatype: 'json',
                beforeSend: function () {},
                success: function (data) {
                    resolve(data.data)
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.error(textStatus)
                    reject(false)
                }
            })
        })
    }
    // 处理
    const handleCardList = function (list_index, position) {
        let html = ''
        cardInfoHeight = Number($('html').css('fontSize').replace('px', '')) * 1.75
        for (let i = 0; i < list_index.length; i++) {
            // 获取卡片总高度
            const cardAllHeight = imgHeights[list_index[i]]
            // 如果高度为0说明图片有问题，则不展示
            if (!cardAllHeight) {
                continue
            }
            // 图片实际高度 计算的高度 - 卡片信息高度
            let he = `${cardAllHeight - cardInfoHeight}px`
            let item = allList[list_index[i]]
            const like_img = item.is_like ? './image/like-active.png' : './image/like.png'
            const like_num = item.like_num ? item.like_num : '种草'
            const originalbyv = item.image_link.split('?')[0]
            let deleteHtml = ''
            if(item.is_delete){
                deleteHtml = `
                    <div class="delete" data-pictureid="${item.picture_id}">
                        <i>×</i>
                    </div>
                `
            }
            html = `
                <li class="card-item">
                    <div class="image-box" style="height: ${he}">
                        <img class="lazy ${position}" data-original="${item.image_link}" data-originalbyv="${originalbyv}"alt="">
                    </div>
                    <div class="card-info">
                        <div class="user-info">
                            <div class="user-head">
                                <img src="${item.avatar}" alt="" class="avatar"> 
                                <img src="${item.avatar_border}" alt="" class="border">
                            </div>
                            <h3 class="user-name">${item.username}</h3>
                        </div>
                        <div class="like-box" data-like="${item.is_like}" data-pictureid="${item.picture_id}">
                            <div class="image">
                                <img src="${like_img}" alt="">
                            </div>
                            <span class="number">${like_num}</span>
                        </div>
                    </div>
                    ${deleteHtml}
                </li>
            `
            $(`.column-container .card-items.${position}`).append(html)
        }
    }
    // 获取数据列表
    const getData = function () {
        listParams = apiParams(listParams)
        listLoadingStyle('add')
        getItemsList().then((data) => {
            allList = data.rows
            if(!allList.length){
                scrollLoading = false
                return false
            }
            listParams.version = data.version
            return utility.loadImgHeights(allList)
        }).then((heights) => {
            if(!heights){
                listLoadingStyle('delete')
                return false
            }
            imgHeights = heights
            leftList = utility.dpHalf(imgHeights).indexes || []
            rightList = utility.omitByIndexes(allList, leftList) || []
            handleCardList(leftList, utility.getColumnPosition())
            handleCardList(rightList, utility.getColumnPosition())
            $(".card-items img.lazy.left").lazyload({effect: "fadeIn"});
            $(".card-items img.lazy.right").lazyload({effect: "fadeIn"});
            scrollLoading = true
            listLoadingStyle('delete')
        }).catch((error) => {
            console.error(error)
        })
    }
    getData()
    $(window).off('scroll').on('scroll',function (event) {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
        const windowHeight = document.documentElement.clientHeight || document.body.clientHeight
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
        const px = Number($('html').css('fontSize').replace('px', ''))
        $('.header-box').css({background: 'transparent' })
        if(scrollTop >= px*2-10){
            $('.header-box').css({background: 'linear-gradient(180deg, #78D088 0%, #ACE4B6 100%)' })
        }
        if(scrollHeight - (scrollTop + windowHeight)  >= 100 || !scrollLoading) {
            return false
        }
        scrollLoading = false
        listParams.page +=1
        getData()
    })

    // 刷新当前页面
    $('.refresh-page').off().on('click', function (event) {
        listParams.page = 1
        listParams.version = 0
        scrollLoading = false
        $('html,body').animate({scrollTop: 0}, 200);
        $(`.column-container .card-items`).empty()
        listLoadingStyle('delete')
        getData()
        destroyBubble(event)
    })

    // 排序
    $('.container .order-box').off().on('click', function (event) {
        if (event.target.tagName !== 'LI') {
            return false
        }
        const $this = $(event.target)
        const order = $this.data('order')
        if (Number(listParams.type) === Number(order)) {
            return false
        }
        $this.addClass('active');
        $this.siblings().removeClass('active');
        listParams.type = Number(order)
        listParams.page = 1
        listParams.version = 0
        scrollLoading = false
        $('html,body').animate({scrollTop: 0}, 200);
        $(`.column-container .card-items`).empty()
        listLoadingStyle('delete')
        getData()
        window.AnalysysAgent.track('change_order', {
            order_kind: (Number(order) === 1 ? 'hot' : 'new')
        })
    })
    const $cardItems = $('.column-container .card-items')
    // 点赞 或者 取消点赞
    const likeClick = function ($this) {
        if(!appInteractive.appParameters.login_token){
            login()
            return false
        }
        const is_like = $this.data('like')
        const picture_id = $this.data('pictureid')
        let number = $this.children('.number').text()
        !is_like ? likeParams.type = 1 : likeParams.type = 0
        likeParams.picture_id = picture_id
        likeParams = apiParams(likeParams)
        $.ajax({
            type: 'POST',
            url: `${apiUrl}/picture/like-or-cancel`,
            headers: ajaxHeader,
            data: likeParams,
            datatype: 'json',
            success: function (data) {
                // 点赞
                if(!is_like){
                    Number(number) ? $this.children('.number').text(Number(number) + 1) : $this.children('.number').text(1)
                    $this.data('like', 1)
                    $this.find('.image>img').attr('src', './image/like-active.png')
                }
                else { // 取消点赞
                    number = Number(number) - 1
                    number ? $this.children('.number').text(number) : $this.children('.number').text('种草')
                    $this.data('like', 0)
                    $this.find('.image>img').attr('src', './image/like.png')
                }
            },
            error: function (error) {
                GrowlNotification.notify({
                    width: '90%',
                    position: 'top-center',
                    type: 'error',
                    title: '',
                    description: error.responseJSON ? error.responseJSON.retMsg : '点赞失败',
                    showButtons: false,
                    closeTimeout: 3000
                })
            }
        })
    }
    const likeListener = utility.debounce(likeClick,1000, true)
    $cardItems.off('click', '.card-item .card-info .like-box').on('click', '.card-item .card-info .like-box', function () {
        likeListener($(this))
    })
    // 查看大图
    $cardItems.off('click', '.card-item .image-box > img').on('click', '.card-item .image-box > img', function (event) {
        window.AnalysysAgent.track('click_photo')
        const imageSrc = $(this).data('originalbyv')
        const pswpElement = document.querySelectorAll('.pswp')[0];
        $.ajax({
            type: 'GET',
            url: `${imageSrc}?imageInfo`,
            datatype: 'json',
            success: function (data) {
                let urlParams = ''
                if(data.format!=='gif'){
                    urlParams = '?imageMogr2/format/jpg|imageMogr2/quality/70'
                }
                const items = [
                    {
                        src: imageSrc + urlParams,
                        w: Number(data.width),
                        h: Number(data.height)
                    }
                ];
                const options = {
                    index: 0,
                    tapToClose: true
                };
                const gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
                gallery.init();
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                GrowlNotification.notify({
                    width: '90%',
                    position: 'top-center',
                    type: 'error',
                    title: '',
                    description: '打开大图失败，请稍候再试',
                    showButtons: false,
                    closeTimeout: 3000
                })
            }
        })
    })
    // 删除图片
    $cardItems.off('touchstart', '.card-item .delete').on('touchstart', '.card-item .delete', function (event) {
        const picture_id = $(this).data('pictureid')
        deleteParams.picture_id = picture_id
        deleteParams = apiParams(deleteParams)
        $.ajax({
            type: 'POST',
            url: `${apiUrl}/picture/delete`,
            headers: ajaxHeader,
            data: deleteParams,
            datatype: 'json',
            success: function (data) {
                GrowlNotification.notify({
                    width: '90%',
                    position: 'top-center',
                    type: 'success',
                    title: '',
                    description: '删除成功，刷新页面后生效',
                    showButtons: false,
                    closeTimeout: 3000
                })
            },
            error: function (error) {
                GrowlNotification.notify({
                    width: '90%',
                    position: 'top-center',
                    type: 'error',
                    title: '',
                    description: error.responseJSON ? error.responseJSON.retMsg : '删除失败',
                    showButtons: false,
                    closeTimeout: 3000
                })
            }
        })
    })
    // endregion

    // region 上传相关
    // file数组
    let resultUpFile = []
    const maxSize = 4 * 1024 * 1024 // 单位M

    // 上传之前
    const fileInputOnchange = function (files) {
        resultUpFile = []
        for (const file of files) {
            resultUpFile.push(utility.fileRename(file, file.type))
        }
        if (!resultUpFile.length) {
            return false
        }
        if (resultUpFile[0].size > maxSize) {
            GrowlNotification.notify({
                width: '90%',
                position: 'top-center',
                type: 'warning',
                title: '',
                description: '图片大小不可超过4M',
                showButtons: false,
                closeTimeout: 3000
            })
            return false
        }
        // 如果为gif图则不做任何压缩处理
        if (resultUpFile[0].type === 'image/gif') {
            utility.fileByBase64(resultUpFile[0], function (url) {
                const $uploadArea = $('.container .upload-area')
                $uploadArea.show()
                $uploadArea.children('.up-image-box').html(`<img src="${url}" alt=""/>`)
            })
            return false
        }
        // 否则则进行压缩
        new Compressor(resultUpFile[0], {
            quality: 0.7,
            success(result) {
                resultUpFile[0] = result
                utility.fileByBase64(result, function (url) {
                    const $uploadArea = $('.container .upload-area')
                    $uploadArea.show()
                    $uploadArea.children('.up-image-box').html(`<img src="${url}" alt=""/>`)
                })
            },
            error(err) {
                GrowlNotification.notify({
                    width: '90%',
                    position: 'top-center',
                    type: 'warning',
                    title: '',
                    description: '图片失效，请重新尝试',
                    showButtons: false,
                    closeTimeout: 3000
                })
            },
        })
    }
    // 上传成功
    const fileUploadSuccess = function (file, info) {
        let url = `https://pic.iyingdi.com/${info.Key}`
        if (resultUpFile[0].type !== 'image/gif') {
            url = `${url}?imageMogr2/format/jpg|imageMogr2/quality/50`
        }
        resultUpFile = []
        $.busyLoadFull("hide");
        uploadParams.resource = url
        uploadParams = apiParams(uploadParams)
        $.ajax({
            type: 'POST',
            url: `${apiUrl}/picture/upload`,
            headers: ajaxHeader,
            data: uploadParams,
            datatype: 'json',
            success: function (data) {
                GrowlNotification.notify({
                    width: '90%',
                    position: 'top-center',
                    type: 'success',
                    title: '',
                    description: '上传成功，审核通过后自动发布',
                    showButtons: false,
                    closeTimeout: 3000
                })
            },
            error: function (error) {
                GrowlNotification.notify({
                    width: '90%',
                    position: 'top-center',
                    type: 'error',
                    title: '',
                    description: error.responseJSON ? error.responseJSON.retMsg : '上传失败，请稍候再试',
                    showButtons: false,
                    closeTimeout: 3000
                })
            }
        })
    }
    // 上传失败
    const fileUploadError = function (error){
        $.busyLoadFull("hide");
        GrowlNotification.notify({
            width: '90%',
            position: 'top-center',
            type: 'error',
            title: '',
            description: '图片不符合规范，请更换后再试',
            showButtons: false,
            closeTimeout: 3000
        })
        resultUpFile = []
    }
    // 上传组件
    const fileGosUpload = new GosUpload.GosUpload({
        host: 'https://gos.gaeamobile.net',
        key: 'f17b8ac4d26aca60',
        bucketName: 'f5e7699a3d90a5b5427165ced2956fb7',
        bucketPath: '/yingdi_activity/photowall',
        fileUploaded: fileUploadSuccess,
        error: fileUploadError
    })

    // 选择图片
    $('.open-upload-area').off().on('click', function () {
        if(!appInteractive.appParameters.login_token){
            login()
            return false
        }
        $('.container .image-upload').trigger('click')
        window.AnalysysAgent.track('click_sent_photo')
    })
    // 准备上传
    $('.container .image-upload').off().on('change', function (event) {
        fileInputOnchange(this.files)
        // 每次change完成之后清空input，防止下次无法触发change事件
        $(this).val('')
        destroyBubble(event)
    })
    // 取消上传
    $('.container .up-image-action-box .cancel').off().on('click', function (event) {
        const $uploadArea = $('.container .upload-area')
        $uploadArea.hide()
        resultUpFile = []
        destroyBubble(event)
    })
    // 重新选择图片
    $('.container .up-image-action-box .reselect').off().on('click', function (event) {
        $('.container .image-upload').trigger('click')
        destroyBubble(event)
    })

    // 确认上传
    $('.container .up-image-action-box .confirm').off().on('click', function (event) {
        const $uploadArea = $('.container .upload-area')
        $uploadArea.hide()
        $.busyLoadSetup({
            animation: "slide",
            spinner: 'cube',
            background: "rgba(0, 0, 0, 0.8)",
            text: '正在上传，请稍候',
            textColor: '#fff'
        });
        $.busyLoadFull("show");
        fileGosUpload.fileArr = resultUpFile
        fileGosUpload.upload(fileGosUpload.fileArr[0])
        destroyBubble(event)
        window.AnalysysAgent.track('confirm_sent_photo')
    })

    // endregion
})
