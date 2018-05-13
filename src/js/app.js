App = {
    web3Provider : null,
    contracts: {},
    account : '0x0',
    loading : false,
    tokenPrice : 1000000000000000,
    tokenSold :0,
    tokensAvailable : 750000,

    init : function(){
        console.log("App initialized");
        return App.initWeb3();
    },

    initWeb3 : function(){
        if(typeof web3 !== 'undefined'){
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        }else{
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
            web3 = new Web3(App.web3Provider);
        }
    
        return App.initContracts();
    },

    initContracts : function(){
        $.getJSON("DappTokenSale.json", function(dappTokenSale){
            App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
            App.contracts.DappTokenSale.setProvider(App.web3Provider);
            App.contracts.DappTokenSale.deployed().then(function(dappTokenSale){
                console.log("Dapp token sale address: "+ dappTokenSale.address);
            })
        }).done(function(){
            $.getJSON("DappToken.json", function(dappToken){
                App.contracts.DappToken = TruffleContract(dappToken);
                App.contracts.DappToken.setProvider(App.web3Provider);
                App.contracts.DappToken.deployed().then(function(dappToken){
                    console.log("Dapp token address: "+ dappToken.address);
            });
        });
        App.listenForEvents();
        return App.render();
    })
    },
    listenForEvents : function(){
        App.contracts.DappTokenSale.deployed().then(function(instance){
            instance.Sell({},{
                fromBlock : 0,
                toBlock : 'latest'
            }).watch(function(error,event){
                console.log("event triggered", event);
                App.render();
            })
        })
    },
    render : function(){
        if(App.loading){
            return;
        }
        App.loading = true;
        var loader = $("#loader");
        var content = $("#content");

        loader.show();
        content.hide();

        web3.eth.getCoinbase(function(err,account){
            if(err === null){
                App.account = account;
                $("#accountAddress").html("Your Account: "+account);
                console.log("account address: "+ account);
            }
        });

        App.contracts.DappTokenSale.deployed().then(function(instance){
            dappTokenSaleInstance = instance;
            return dappTokenSaleInstance.tokenPrice();
        }).then(function(price){
            App.tokenPrice = price;
            $(".token-price").html(web3.fromWei(App.tokenPrice, "ether").toNumber());
            return dappTokenSaleInstance.tokenSold()
        }).then(function(tokenSold){
            App.tokenSold = tokenSold.toNumber();
            $('.token-sold').html(App.tokenSold);
            $('.token-availble').html(App.tokensAvailable);

            var progressPercent = (App.tokenSold / App.tokensAvailable) * 100;
            $('#progress').css('width', progressPercent+'%');

            App.contracts.DappToken.deployed().then(function(instance){
                dappTokenInstance = instance;
                return dappTokenInstance.balanceOf(App.account);
            }).then(function(balance){
                $('.ver-balance').html(balance.toNumber());
                App.loading = false;
                loader.hide();
                content.show();
            })         
        });
    },

    buyTokens : function(){
        $("#loader").show();
        $("#content").hide();
        var numberOfTokens = $('#numberOfTokens').val();
        App.contracts.DappTokenSale.deployed().then(function(instance){
            dappTokenSaleInstance = instance;
            return dappTokenSaleInstance.buyTokens(numberOfTokens,{
                from : App.account,
                value : numberOfTokens * App.tokenPrice,
                gas : 500000
            });
        }).then(function(result){
           console.log("Tokens bought...");
           $('form').trigger('reset');  
        })
    }
}

$(function(){
    $(window).load(function(){
        App.init();
    })
});