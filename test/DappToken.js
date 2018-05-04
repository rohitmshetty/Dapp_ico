var DappToken = artifacts.require("./DappToken.sol");

contract('DappToken', function(accounts) {

  it('intializes contact with the correct values', function(){
     return DappToken.deployed().then(function(instance){
        tokenInstance = instance;
        return tokenInstance.name();
     }).then(function(name){
        assert.equal(name,'Veronica','has the correct name');
        return tokenInstance.symbol(); 
    }).then(function(symbol){
        assert.equal(symbol,'VER','has the correct symbol');
        return tokenInstance.standard();     
    }).then(function(standard){
        assert.equal(standard,'Veronica token v1.0','has the correct standard')
    });
  })

  it('sets the total supply and allocates the initial supply to admin account upon deployment', function() {
    return DappToken.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.totalSupply();
    }).then(function(totalSupply) {
      assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1,000,000');
      return tokenInstance.balanceOf(accounts[0]);
    }).then(function(adminBalance){
      assert.equal(adminBalance.toNumber(),1000000, 'it allocates the initial supply to admin account');
    });
  });

  it('transfer token ownership', function(){
      return DappToken.deployed().then(function(instance){
        tokenInstance = instance;
        return tokenInstance.transfer.call(accounts[1],99999999999999999);
      }).then(assert.fail).catch(function(error){
        assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        return tokenInstance.transfer.call(accounts[1],250000,{from: accounts[0]});
      }).then(function(success){
        assert.equal(success,true,'transfer function returns true');
        return tokenInstance.transfer(accounts[1],250000,{from: accounts[0]});
      }).then(function(reciept){
        assert.equal(reciept.logs.length, 1, 'triggers one event');
        assert.equal(reciept.logs[0].event,'Transfer','should be the transfer event');
        assert.equal(reciept.logs[0].args._from,accounts[0],'Logs the account the tokens are transferred from');
        assert.equal(reciept.logs[0].args._to,accounts[1],'Logs the account the tokens are transferred to');
        assert.equal(reciept.logs[0].args._value,250000,'Logs the transfer amount');
        return tokenInstance.balanceOf(accounts[1]);
      }).then(function(balance){
        assert.equal(balance.toNumber(),250000,'adds the amount to the recieving account');
        return tokenInstance.balanceOf(accounts[0]);
      }).then(function(balance){
        assert.equal(balance.toNumber(),750000,'adds the amount to the sending account');
      })
  });

  it('approve tokens for delegated transfer', function(){
      return DappToken.deployed().then(function(instance){
        tokenInstance = instance;
        return tokenInstance.approve.call(accounts[1],100);
      }).then(function(success){
         assert.equal(success,true,'it returns true');
         return tokenInstance.approve(accounts[1],100, {from : accounts[0]}); 
      }).then(function(reciept){
        assert.equal(reciept.logs.length, 1, 'triggers one event');
        assert.equal(reciept.logs[0].event,'Approval','should be the approval event');
        assert.equal(reciept.logs[0].args._owner,accounts[0],'Logs the account the tokens are transferred from');
        assert.equal(reciept.logs[0].args._spender,accounts[1],'Logs the account the tokens are transferred to');
        assert.equal(reciept.logs[0].args._value,100,'Logs the transfer amount');
        return tokenInstance.allowance(accounts[0], accounts[1]);
      }).then(function(allowance){
        assert.equal(allowance,100,'stores the allowance for delegated transfer');
      });
  });

  it('handles delegate transfer tokens').then(function(){
      return DappToken.deployed().then(function(instance){
            tokenInstance = instance;
            fromAccount = accounts[2];
            toAccount = accounts[3];
            spendingAccount = accounts[4];
      })
  })
});
