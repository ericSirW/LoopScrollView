cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad() {
        let testData = [
            { c1: "头", c2: 2, c3: 3 },
            { c1: 11, c2: 2, c3: 3 },
            { c1: 12, c2: 2, c3: 3 },
            { c1: 13, c2: 2, c3: 3 },
            { c1: 14, c2: 2, c3: 3 },
            { c1: 15, c2: 2, c3: 3 },
            { c1: 154, c2: 32, c3: 3 },
            { c1: 158, c2: 255, c3: 3 },
            { c1: 159, c2: 2, c3: 3 },
            { c1: 156, c2: 25555, c3: 3 },
            { c1: 158, c2: 233, c3: 3 },
            { c1: 156, c2: 2, c3: 3 },
            { c1: 155, c2: 2, c3: 3 },
            { c1: 151, c2: 2, c3: "尾" },
        ];
        this.serverData = testData;

        this.compScrollView = this.node.getComponent("LoopScrollView");
        let instance = this;
        this.compScrollView.showAllItem(testData.length, function(){
            instance.showItem.apply(instance, [].slice.call(arguments));
        });

    },

    showItem(itemNode, idx, isStartOver, isStart) {

        let tData = this.serverData[idx];
        itemNode.getChildByName("c1").getComponent(cc.Label).string = tData.c1;
        itemNode.getChildByName("c2").getComponent(cc.Label).string = tData.c2;
        itemNode.getChildByName("c3").getComponent(cc.Label).string = tData.c3;

        if(isStart){
            itemNode.active = false;
            if (idx == 0) this.compScrollView.setCanTouch(false);
            setTimeout(() => {
                if (!itemNode) return;
                itemNode.active = true;
                let tOriginX = itemNode.x;
                let targetPositonY = itemNode.y;
                itemNode.x = tOriginX + 300;
                itemNode.y = targetPositonY - 50;
                cc.tween(itemNode).by(0.15, { position: cc.v2(-300, 50) })
                    .call(() => {
                        //可以设置按钮点击状态等
                        if (isStartOver) this.compScrollView.setCanTouch(true);
                    })
                    .start();
            }, idx * 100);
        }else{
            itemNode.active = true;
        }
    },
});
