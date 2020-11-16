const autoMoveIntervalTime = 1 / 60 * 1000; //每次滚动惯性刷新的时间间隔
cc.Class({
    extends: cc.Component,
    properties: {
        nodeSpace: { default: 10, tooltip: "节点之间的间距" },
        brakeValue: { default: 1, tooltip: "滚动系数，0为永不停止，1立即停止" },
        minMoveSpace: { default: 0.1, tooltip: "单次移动回调最小触发值" },
        loopScrollViewContentNode: { type: cc.Node, default: null, tooltip: "挂载content的节点" },
        loopScrollViewItemNode: { type: cc.Node, default: null, tooltip: "item 节点" },
        showItemCount: { default: 5, tooltip: "视图中显示的个数" },
        useViewPort: { default: false, tooltip: "使用视口确定显示的item个数, 勾选此项时，shoshowItemCount失效, 视口默认为loopScrollViewContentNode的父节点" },
        vertical: { default: true, tooltip: "垂直方向移动， false为水平方向" },
        contentViewPortSpace: { default: 0, tooltip: "viewport 与content之间的上边距或下边距" },
        alignType: { default: true, tooltip: "content 停靠父节点方式 true为头部 false为尾部 (头部：垂直时为上到下 水平为前到后, 尾部 反之)" },
        limitMoveDistance: { default: false, tooltip: "滑动距离限制, 开启时单个移动回调距离不超过 item高/宽 " },
        isLoop: { default: false, tooltip: "是否开始数据循环显示，不开启时数据到顶部、底部不可移动,水平亦然" }
    },
    onLoad() {
        if (!this.loopScrollViewItemNode || !this.loopScrollViewContentNode) {
            return;
        }

        this.showItemInfoFunc = false; //用来显示节点数据的方法
        this.dataCount = 0; //数据总量
        this.isLoaded = true;
        this.fristItemNode = false; //头部节点
        this.fianlItemNode = false; //尾部节点
        this.nowFristItemIdx = 0; //头部节点下标
        this.nowFinalItemIdx = 0; //尾部节点下标
        this.nowFristDataIdx = 0; //头部数据下标
        this.nowFianlDataIdx = 0; //尾部数据下标

        this.sourcePos = this.loopScrollViewItemNode.getPosition();

        this.nowDataArr = [];

        this.setShowItemCount();
        this.setContentNodeRect();
        this.loopScrollViewContentNode.on(cc.Node.EventType.TOUCH_MOVE, this.onContentTouchMove, this);
        this.loopScrollViewContentNode.on(cc.Node.EventType.TOUCH_START, this.onContentTouchStart, this);
        this.loopScrollViewContentNode.on(cc.Node.EventType.TOUCH_END, this.onContentTouchEnd, this);
        this.loopScrollViewContentNode.on(cc.Node.EventType.TOUCH_CANCEL, this.onContentTouchEnd, this);
    },

    //子节点做特殊操作时 建议关闭
    setCanTouch(state) {
        this.canTouch = state;
    },

    getCanTouch() {
        return !!this.canTouch;
    },

    doNodeMove(pDistance) {
        if (this.vertical) {
            return this.doNodeMoveY(pDistance);
        } else {
            return this.doNodeMoveX(pDistance);
        }
    },

    doNodeMoveX() {

    },

    doNodeMoveY(changePosY) {

        let [canMove, newChangeY] = this.getCanDoMoveByLoopType(changePosY);
        if (!canMove) {
            return false;
        } else {
            if (!this.isLoop) changePosY = newChangeY;
        };
        let tContentNode = this.loopScrollViewContentNode;
        tContentNode.children.forEach(el => {
            el.y += changePosY;
        })
        let btnSpace = this.nodeSpace;
        let tFinalItemNode = this.fianlItemNode;
        let tFristItemNode = this.fristItemNode;
        let tHeight = tFristItemNode.height;
        //let tAnchorY = tFristItemNode.anchorY; 原为锚点边对齐判断 可能修改回去
        let tFrtistAlign = this.alignFirst;
        let tFinalAlign = this.alignFinal;
        if (changePosY > 0) { //上滑
            if (tFrtistAlign + tHeight <= tFristItemNode.y) { //+ tHeight * (1 - tAnchorY)
                tFristItemNode.y = tFinalItemNode.y - btnSpace - tHeight;
                this.changNowItemAndDataIdx(1);
            }
        } else {
            if (tFinalAlign >= tFinalItemNode.y) { //- tHeight * tAnchorY - tHeight
                tFinalItemNode.y = tFristItemNode.y + btnSpace + tHeight;
                this.changNowItemAndDataIdx(-1);
            }
        }
        return [true, "11"];
    },

    //设置实际显示的个数
    setShowItemCount() {
        if (this.useViewPort || this.showItemCount <= 0) {
            if (this.vertical) {
                this.showItemCount = Math.ceil(this.loopScrollViewContentNode.parent.height / (this.loopScrollViewItemNode.height + this.nodeSpace));
            } else {
                this.showItemCount = Math.ceil(this.loopScrollViewContentNode.parent.width / (this.loopScrollViewItemNode.width + this.nodeSpace));
            }
        }
    },

    //设置content 节点坐标 --
    setContentNodeRect() {
        //可以将视口直接挂在content节点上 所以此处暂时如此处理
        let tItemCountNode = this.loopScrollViewContentNode;
        tItemCountNode.width = tItemCountNode.parent.width;
        tItemCountNode.height = tItemCountNode.parent.height;
        if (this.vertical) {
            this.setNodePositonAlignParent(tItemCountNode, tItemCountNode.parent, this.alignType, this.contentViewPortSpace);
        } else {
            //
        }
    },

    //设置节点坐标使其一边与父节点的边重合
    //此处处理为Y方向 x同理
    /**
     * 
     * @param {*cc.Node} childNode 需要设置坐标的子节点
     * @param {*cc.Node} parentNode 作为参照物的父节点
     * @param {*boolen} isTop 节点贴上边
     * @param {*number} offestNum 初始位置偏移
     */
    setNodePositonAlignParent(childNode, parentNode, isTop = true, offestNum = 0, returnPosition) {
        let pAnchorY = parentNode.anchorY;
        let cAnchorY = childNode.anchorY;

        let pHeight = parentNode.height;
        let cHeight = childNode.height;
        let tChildNodeY = 0;
        if (isTop) {
            tChildNodeY = pHeight * (1 - pAnchorY) - (1 - cAnchorY) * cHeight - offestNum; //父节点内部往上 自己往下对齐
        } else {
            tChildNodeY = -pHeight * pAnchorY + cAnchorY * cHeight + offestNum; //父节点内部往下 自己往上对齐
        }
        if (returnPosition) {
            return tChildNodeY;
        }
        childNode.y = tChildNodeY;
    },

    //设置节点坐标使其一边与父节点的边重合
    //此处处理为X方向
    /**
     * 
     * @param {*cc.Node} childNode 需要设置坐标的子节点
     * @param {*cc.Node} parentNode 作为参照物的父节点
     * @param {*boolen} isTop 节点贴上边
     * @param {*number} offestNum 初始位置偏移
     */
    setNodePositonAlignParentX(childNode, parentNode, isTop = true, offestNum = 0, returnPosition) {
        let pAnchorX = parentNode.anchorX;
        let cAnchorX = childNode.anchorX;

        let pWidth = parentNode.width;
        let cWidth = childNode.width;
        let tChildNodeX = 0;
        if (isTop) {
            tChildNodeX = pWidth * (1 - pAnchorX) - (1 - cAnchorX) * cWidth - offestNum; //父节点内部往上 自己往下对齐
        } else {
            tChildNodeX = -pWidth * pAnchorX + cAnchorX * cWidth + offestNum; //父节点内部往下 自己往上对齐
        }
        if (returnPosition) {
            return tChildNodeX;
        }
        childNode.x = tChildNodeX;
    },

    onContentTouchMove(event) {
        if (!this.canTouch) return;
        if (this.vertical) {
            this.onContentTouchMoveY(event);
        } else {

        }
    },

    setMoveSpeed(pDistence, tiemSpace) {
        this.moveSpeed = pDistence / (tiemSpace / 1000);
    },

    getCanDoMoveByLoopType(changPos) {
        if (this.isLoop) return [true, 0];
        //let cannotMove = false;
        // if(changPos > 0){ //上滑
        //     cannotMove = this.nowFianlDataIdx == this.dataCount - 1;
        // }else{
        //     cannotMove = this.nowFristDataIdx == 0;
        // }
        let isTopOrBom = false;
        let tContentNode = this.loopScrollViewContentNode;
        let finalPosAlignY = this.setNodePositonAlignParent(this.fianlItemNode, tContentNode, false, 0, true);
        let zeroPosAilgnY = this.setNodePositonAlignParent(this.fristItemNode, tContentNode, true, 0, true);
        if (changPos < 0) {
            if (this.dataFristItemNode && (this.dataFristItemNode.y  <= zeroPosAilgnY && zeroPosAilgnY <= this.dataFristItemNode.y +  this.nodeSpace)) {
                isTopOrBom = true;
            }
        } else {
            if (this.dataFianlItemNode && (this.dataFianlItemNode.y >= finalPosAlignY) && (this.dataFianlItemNode.y <= finalPosAlignY + this.nodeSpace)) {
                isTopOrBom = true;
            }
        };
        //新增一个过界判断
        if (changPos > 0) { //上滑
            if (this.dataFianlItemNode) {
                if (this.dataFianlItemNode.y < finalPosAlignY && this.dataFianlItemNode.y + changPos > finalPosAlignY) {
                    changPos = finalPosAlignY - this.dataFianlItemNode.y;
                }
            }
        } else {
            if (this.dataFristItemNode) {
                if (this.dataFristItemNode.y > zeroPosAilgnY && this.dataFristItemNode.y + changPos < zeroPosAilgnY) {
                    changPos = zeroPosAilgnY - this.dataFristItemNode.y;
                }
            }
        }

        return [!isTopOrBom, changPos];
    },

    onContentTouchMoveY(event) {

        let lastPositonY = this.startTouchPosition;
        let tPositionY = event.currentTouch._point.y;
        //先自由循环列表
        let changePosY = tPositionY - lastPositonY;

        let tFristItemNode = this.fristItemNode;
        let tHeight = tFristItemNode.height;

        if (this.limitMoveDistance) {
            changePosY = Math.abs(changePosY) > tHeight ? tHeight : changePosY;
        };

        if (Math.abs(changePosY) <= this.minMoveSpace) {
            return;
        };

        let nowTime = new Date().getTime();
        let timeInterval = nowTime - this.startTouchTime;
        this.startTouchPosition = tPositionY;
        this.setMoveSpeed(changePosY, timeInterval);

        this.doNodeMove(changePosY);
    },

    onContentTouchStart(event) {
        this.cantBrakeMove = false;
        this.moveSpeed = 0;
        this.startTouchTime = new Date().getTime();
        this.startTouchPosition = this.vertical ? event.currentTouch._point.y : event.currentTouch._point.x;
    },

    getCanDoMoveHold() {
        let nextMoveDistance = this.getMoveDistance();
        return Math.abs(nextMoveDistance) >= this.minMoveSpace;
    },

    onContentTouchEnd() {
        this.touchEndTime = new Date().getTime();
        let isHold = this.getCanDoMoveHold();
        this.cantBrakeMove = true;
        if (!isHold) {
            return;
        }
        this.startBrakeMove();
    },

    onDisable() {
        this.cantBrakeMove = false;
        clearTimeout(this.brakeMoveTimeOut);
    },

    startBrakeMove() {
        let instance = this;
        this.brakeMoveTimeOut = setTimeout(function () {
            if (!instance.cantBrakeMove || !instance) {
                return;
            }
            let isHold = instance.getCanDoMoveHold();
            let [canDo, _] = instance.doNodeMove(instance.getMoveDistance());
            canDo && isHold && instance.startBrakeMove();
        }, 1000 / 60);
    },

    getMoveDistance() {
        let nowTime = new Date().getTime();
        let endTime = this.touchEndTime;
        let tMoveTimeSpace = nowTime - endTime;
        let moveIdx = Math.floor(tMoveTimeSpace / autoMoveIntervalTime / 100);
        moveIdx = moveIdx < 1 ? 1 : moveIdx;
        let nowSpeed = Math.pow((1 - this.brakeValue), moveIdx) * this.moveSpeed;
        return nowSpeed * autoMoveIntervalTime / 1000;
    },

    /**
     * 
     * @param {*number} dataCount 数据总量 
     * @param {*} callBack 回调函数 返回item 与该item的数据下标 已经是否首次创建(用于初始动画等操作的判断)
     */
    showAllItem(dataCount, callBack) {

        if (!this.isLoaded) {
            return this.scheduleOnce(this.showAllItem.bind(this, dataCount, callBack), 0.0);
        }
        //初始化数据
        clearTimeout(this.brakeMoveTimeOut);
        this.dataCount = dataCount;
        this.showItemInfoFunc = callBack;
        let tItemCountNode = this.loopScrollViewContentNode;
        let tItemChildrenCount = tItemCountNode.childrenCount;
        let tItemNode = this.loopScrollViewItemNode;
        let tShowItemCount = this.showItemCount + 1;
        tShowItemCount = tShowItemCount > dataCount ? dataCount : tShowItemCount;
        let len = tShowItemCount > tItemChildrenCount ? tShowItemCount : tItemChildrenCount;
        for (let i = 0; i < len; i++) {
            let tNode = tItemCountNode.children[i] || cc.instantiate(tItemNode);
            (!tNode.parent) && (tNode.parent = tItemCountNode);
            tNode.stopAllActions();
            tNode.active = i < tShowItemCount;
            dataCount > i && this.nowDataArr.push(i);
        }

        this.fristItemNode = tItemCountNode.children[0];
        this.fianlItemNode = tItemCountNode.children[tShowItemCount - 1];
        this.nowFristItemIdx = 0;
        this.nowFinalItemIdx = tShowItemCount - 1;
        this.nowFristDataIdx = 0;
        this.nowFianlDataIdx = tShowItemCount - 1;
        this.dataFristItemNode = tItemCountNode.children[0];
        this.dataFianlItemNode = dataCount > tShowItemCount ? false : tItemCountNode.children[dataCount - 1];
        this.sortBtnPosition(tItemCountNode.children, tItemCountNode.anchorY, this.alignType, callBack);
        this.setAilgnPoint(this.fristItemNode, this.fianlItemNode);
    },

    setAilgnPoint(fristNode, finallNode) {
        let isVertical = this.vertical;
        this.alignFirst = isVertical ? fristNode.y : fristNode.x;
        this.alignFinal = isVertical ? finallNode.y : finallNode.x;
    },

    callShowItemDataFunc(pNode, idx) {
        //pNode.setPosition(this.sourcePos);
        this.showItemInfoFunc && this.showItemInfoFunc(pNode, idx);
    },

    //设置节点坐标使其一边与父节点的边重合
    //此处处理为Y方向 x同理
    /**
     * 
     * @param {*cc.Node} childNode 需要设置坐标的子节点
     * @param {*cc.Node} parentNode 作为参照物的父节点
     * @param {*boolen} isTop 节点贴上边
     * @param {*number} offestNum 初始位置偏移
     */
    setNodePositonAlignParent(childNode, parentNode, isTop = true, offestNum = 0, returnPosition) {
        let pAnchorY = parentNode.anchorY;
        let cAnchorY = childNode.anchorY;

        let pHeight = parentNode.height;
        let cHeight = childNode.height;
        let tChildNodeY = 0;
        if (isTop) {
            tChildNodeY = pHeight * (1 - pAnchorY) - (1 - cAnchorY) * cHeight - offestNum; //父节点内部往上 自己往下对齐
        } else {
            tChildNodeY = -pHeight * pAnchorY + cAnchorY * cHeight + offestNum; //父节点内部往下 自己往上对齐
        }
        if (returnPosition) {
            return tChildNodeY;
        }
        childNode.y = tChildNodeY;
    },

    /**
     * 按传入顺序依次排布节点  
     * btnSpace 为节点之间的间距
     * @param {*array} btnArr 按钮节点数组
     * @param {*number} anchorY 父节点锚点位置
     * @param {*boolen} isTopBegin 从顶部开始排 false则从底部开始排 其他状态自行修改
     * @param {*function} callback 绑定一个回调 节点与应该设置的坐标值会被返回 可以用来进行动画处理等
     * --更换相关参数可按x排布
     * 传入节点数量应在2个及以上
     */
    sortBtnPosition(btnArr, anchorY, isTopBegin, callback) {
        if (btnArr instanceof Array) {
        } else {
            return false;
        };
        let btnSpace = this.nodeSpace;
        let tMuilts = isTopBegin ? -1 : 1;
        let nodeArrLen = btnArr.length; //节点总数
        let lengthSum = btnArr.reduce((perValue, tNode) => { //总高 宽 + 总间距
            return perValue + tNode.height;
        }, btnSpace * (nodeArrLen - 1));
        let maxStartY = this.setNodePositonAlignParent(btnArr[0], btnArr[0].parent, isTopBegin, 0, true);
        btnArr.reduce((perValue, tNode, nodeIdx) => {
            let nodeY = -(lengthSum * (1 - anchorY)) * tMuilts + (perValue + tNode.height * (1 - tNode.anchorY)) * tMuilts;
            let addDown = 0;
            if (isTopBegin) { //对齐
                if (nodeY > maxStartY) {
                    addDown = maxStartY - nodeY;
                    nodeY = maxStartY;
                }
            } else {
                if (nodeY < maxStartY) {
                    addDown = maxStartY - nodeY;
                    nodeY = maxStartY;
                }
            }
            tNode.setPosition(this.sourcePos); //只是设置了x
            tNode.y = nodeY;
            if (callback) {
                callback(tNode, nodeIdx + this.nowFristDataIdx, true); //节点 数据下标 是否初始创建时
            }
            return perValue + tNode.height + btnSpace + addDown * tMuilts;
        }, 0);
    },

        /**
     * 按传入顺序依次排布节点  
     * btnSpace 为节点之间的间距
     * @param {*array} btnArr 按钮节点数组
     * @param {*number} anchorX 父节点锚点位置
     * @param {*boolen} isTopBegin 从左到右
     * @param {*function} callback 绑定一个回调 节点与应该设置的坐标值会被返回 可以用来进行动画处理等
     * --更换相关参数可按x排布
     * 传入节点数量应在2个及以上
     */
    sortBtnPositionX(btnArr, anchorX, isTopBegin, callback) {
        if (btnArr instanceof Array) {
        } else {
            return false;
        };
        let btnSpace = this.nodeSpace;
        let tMuilts = isTopBegin ? -1 : 1;
        let nodeArrLen = btnArr.length; //节点总数
        let lengthSum = btnArr.reduce((perValue, tNode) => { //总高 宽 + 总间距
            return perValue + tNode.width;
        }, btnSpace * (nodeArrLen - 1));
        let maxStartX = this.setNodePositonAlignParentX(btnArr[0], btnArr[0].parent, isTopBegin, 0, true);
        btnArr.reduce((perValue, tNode, nodeIdx) => {
            let nodeX = -(lengthSum * (1 - anchorX)) * tMuilts + (perValue + tNode.width * (1 - tNode.anchorX)) * tMuilts;
            let addDown = 0;
            if (isTopBegin) { //对齐
                if (nodeX > maxStartX) {
                    addDown = maxStartX - nodeX;
                    nodeX = maxStartX;
                }
            } else {
                if (nodeX < maxStartX) {
                    addDown = maxStartX - nodeX;
                    nodeX = maxStartX;
                }
            }
            this.sourcePos && tNode.setPosition(this.sourcePos); //只是设置了y 保证初始对齐
            tNode.x = nodeX;
            if (callback) {
                callback(tNode, nodeIdx + this.nowFristDataIdx, nodeArrLen == nodeIdx); //节点 数据下标 是否初始创建完成
            }
            return perValue + tNode.width + btnSpace + addDown * tMuilts;
        }, 0);
    },

    changNowItemAndDataIdx(changType) {
        let tUseDataTotal = this.dataCount;
        let tChildrenCount = this.loopScrollViewContentNode.childrenCount;
        this.nowFianlDataIdx += changType;
        this.nowFristDataIdx += changType;
        this.nowFristItemIdx += changType;
        this.nowFinalItemIdx += changType;
        let tContentNode = this.loopScrollViewContentNode;
        if (changType > 0) {
            if (this.nowFinalItemIdx > tChildrenCount - 1) {
                this.nowFinalItemIdx = 0;
            }
            if (this.nowFristDataIdx > tUseDataTotal - 1) {
                this.nowFristDataIdx = 0;
            }
            if (this.nowFianlDataIdx > tUseDataTotal - 1) {
                this.nowFianlDataIdx = 0;
            }
            if (this.nowFristItemIdx > tChildrenCount - 1) {
                this.nowFristItemIdx = 0;
            }
        } else {
            if (this.nowFinalItemIdx < 0) {
                this.nowFinalItemIdx = tChildrenCount - 1;
            }
            if (this.nowFristDataIdx < 0) {
                this.nowFristDataIdx = tUseDataTotal - 1;
            }
            if (this.nowFianlDataIdx < 0) {
                this.nowFianlDataIdx = tUseDataTotal - 1;
            }
            if (this.nowFristItemIdx < 0) {
                this.nowFristItemIdx = tChildrenCount - 1;
            }
        }
        this.fristItemNode = tContentNode.children[this.nowFristItemIdx];
        this.fianlItemNode = tContentNode.children[this.nowFinalItemIdx];
        if (this.nowFristDataIdx == 0) {
            this.dataFristItemNode = tContentNode.children[this.nowFristItemIdx];
        }
        if (this.nowFristDataIdx == tUseDataTotal - 1) {
            this.dataFianlItemNode = tContentNode.children[this.nowFristItemIdx];
        }
        if (this.nowFianlDataIdx == tUseDataTotal - 1) {
            this.dataFianlItemNode = tContentNode.children[this.nowFinalItemIdx];
        }
        if (this.nowFianlDataIdx == 0) {
            this.dataFristItemNode = tContentNode.children[this.nowFinalItemIdx];
        }
        if (changType > 0) {
            this.nowDataArr.shift();
            this.nowDataArr.push(this.nowFianlDataIdx);
            this.callShowItemDataFunc(this.fianlItemNode, this.nowFianlDataIdx);
        } else {
            this.nowDataArr.pop();
            this.nowDataArr.unshift(this.nowFristDataIdx);
            this.callShowItemDataFunc(this.fristItemNode, this.nowFristDataIdx);
        }
        this.checkFristFinallHad();
    },

    checkFristFinallHad() {
        if (this.nowDataArr.indexOf(this.dataCount - 1) == -1) {
            this.dataFianlItemNode = null;
        }
        if (this.nowDataArr.indexOf(0) == -1) {
            this.dataFristItemNode = null;
        }
    }

});

