var DappTokenSale = artifacts.require('./DappTokenSale.sol');
var DappToken = artifacts.require('./DappToken.sol');


contract('DappTokenSale',function(accounts){
    var tokenInstance;
    var tokenSaleInstance;
    var tokenPrice = 1000000000000000;
    var admin = accounts[0];
    var buyer = accounts[1];
    var tokensAvailable = 750000;
    var numberOfTokens;

    it('initializes the contract with correct valves',function(){
        return DappTokenSale.deployed().then(function(instance){
            tokenSaleInstance = instance;
            return tokenSaleInstance.address;
        }).then(function(address){
            assert.notEqual(address,'0x0','has correct address');
            return tokenSaleInstance.tokenContract();
        }).then(function(address){
            assert.notEqual(address,'0x0','has a token contract');
            return tokenSaleInstance.tokenPrice();
        }).then(function(price){ 
            assert.equal(price,tokenPrice,'token price is correct')
        });
    });

    it('facilitates buying tokens',function(){
        return DappToken.deployed().then(function(instance){
            tokenInstance = instance;
            return DappTokenSale.deployed();
        }).then(function(instance){
            tokenSaleInstance = instance;
            return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, {from : admin});
        }).then(function(reciept){
            numberOfTokens = 10;
            return tokenSaleInstance.buyTokens(numberOfTokens, {from: buyer, value: numberOfTokens * tokenPrice})
        }).then(function(reciept){
            assert.equal(reciept.logs.length,1,'triggers one event');
            assert.equal(reciept.logs[0].event,'Sell','should be the sell event');
            assert.equal(reciept.logs[0].args._buyer,buyer,'logs the account that purchased the token');
            assert.equal(reciept.logs[0].args._amount,numberOfTokens,'logs the number of tokens purchased');
            return tokenSaleInstance.tokenSold();
        }).then(function(amount){
            assert.equal(amount.toNumber(),numberOfTokens,'increments the number of token sold');
            return tokenInstance.balanceOf(tokenSaleInstance.address);
        }).then(function(balance){
            assert.equal(balance.toNumber(), tokensAvailable-numberOfTokens, 'balance of contract address decreased after buying token');
            return tokenInstance.balanceOf(buyer);
        }).then(function(balance){
            assert.equal(balance.toNumber(), numberOfTokens, 'balance of contact address increased after buying tokens');
            return tokenSaleInstance.buyTokens(numberOfTokens,{from: buyer,value: 1});
        }).then(assert.fail).catch(function(error){
            assert(error.message.indexOf('revert') >= 0,'msg.value must equal number of tokens in wei');
            return tokenSaleInstance.buyTokens(800000,{from: buyer,value:  numberOfTokens * tokenPrice});
        }).then(assert.fail).catch(function(error){
            assert(error.message.indexOf('revert') >= 0,'cannot purchase more tokens than available');
        })
    });

        it('end of token sale', function(){
            return DappToken.deployed().then(function(instance){
                tokenInstance = instance;
                return DappTokenSale.deployed();
            }).then(function(instance){
                tokenSaleInstance = instance;
                return tokenSaleInstance.endSale({from: buyer});
            }).then(assert.fail).catch(function(error){
                assert(error.message.indexOf('revert') >= 0,'this function should always be called by admin');
                return tokenSaleInstance.endSale({from: admin});    
            }).then(function(reciept){
                return tokenInstance.balanceOf(admin);
            }).then(function(balance){
                assert.equal(balance,999990,'remaining tokens are transferred to admin');
                return tokenSaleInstance.tokenPrice();   
            }).then(function(price){
                assert.equal(price,0,'token price is set to zero');
            })  
        });
});