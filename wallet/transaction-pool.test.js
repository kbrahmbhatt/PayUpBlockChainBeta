const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');
const Blockchain = require('../blockchain');

describe('TransactionPool', () => {
    let tp, wallet, transaction, bc;

    beforeEach(() => {
        tp = new TransactionPool();
        wallet = new Wallet();
        bc = new Blockchain();
        transaction = wallet.createTransaction('p4yu6-8r0', 40, bc, tp);
    });

    it('adds a transaction to the pool', () => {
        expect(tp.transactions.find(t => t.id === transaction.id)).toEqual(transaction);
    });

    it('clear transaction pool', () => {
        tp.clear();
        expect(tp.transactions).toEqual([]);
    });

    describe('checking valid transactions my guy', () => {
        let validTransactions;

        beforeEach(() => {
            validTransactions = [...tp.transactions];
            for(let i=0; i<6; i++){
                wallet = new Wallet();
                transaction = wallet.createTransaction('p4yu6-8r0',40,bc,tp);
                if(i%2==0){
                    transaction.input.amount = 99999;
                } else{
                    validTransactions.push(transaction);
                }
            }
        });

        it('shows difference between valid and corrupt shit', () => {
            expect(JSON.stringify(tp.transactions)).not.toEqual(JSON.stringify(validTransactions));
        });

        it('grabs valid transactions', () => {
            expect(tp.validTransactions()).toEqual(validTransactions);
        });
    });
});