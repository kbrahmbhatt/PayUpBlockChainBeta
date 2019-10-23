const { INITIAL_BALANCE } = require('../config');
const Transaction= require('./transaction');
const ChainUtil = require('../chain-util');

class EWallet {
    constructor(key){
      this.balance = 0
      this.keyPair = ChainUtil.genKeyPair();
      this.publicKey = key;
    }

    toString(){
        return `EWallet -
            publicKey: ${this.publicKey.toString()}
            balance  : ${this.balance}`
    }

    sign(dataHash){
        return this.keyPair.sign(dataHash);
    }
    
    createTransaction(recipient, amount, blockchain, transactionPool){
        this.balance = this.calculateBalance(blockchain);

        if (amount > this.balance){
            console.log(`Amount: ${amount} exceeds current balance: ${this.balance}`);
            return;
        }

        if(recipient == this.publicKey){
            console.log("You can't send to yourself dummy");
            return;
        }
        
        let transaction = transactionPool.existingTransaction(this.publicKey);

        if(transaction){
            transaction.update(this, recipient, amount);
        }
        else{
            transaction = Transaction.newTransaction(this, recipient, amount);
            transactionPool.addTransaction(transaction);
        }

        return transaction;
    }  

    calculateBalance(blockchain) {
        let balance = this.balance;
        let transactions = [];
        blockchain.chain.forEach(block => block.data.forEach(transaction => {
          transactions.push(transaction);
        }));
    
        const EwalletInputTs = transactions
          .filter(transaction => transaction.input.address === this.publicKey);
    
        let startTime = 0;
    
        if (EwalletInputTs.length > 0) {
          const recentInputT = EwalletInputTs.reduce(
            (prev, current) => prev.input.timestamp > current.input.timestamp ? prev : current
          );
    
          balance = recentInputT.outputs.find(output => output.address === this.publicKey).amount;
          startTime = recentInputT.input.timestamp;
        }
    
        transactions.forEach(transaction => {
          if (transaction.input.timestamp > startTime) {
            transaction.outputs.find(output => {
              if (output.address === this.publicKey) {
                balance += output.amount;
              }
            });
          }
        });
    
        return balance;
      }

}

module.exports = EWallet;