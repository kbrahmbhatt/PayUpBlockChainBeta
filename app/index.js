const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('../blockchain');
const P2pServer = require('./p2p')
const Wallet = require('../wallet');
const TransactionPool = require('../wallet/transaction-pool');
const Miner = require('./miner');
const EWallet = require('../existing_wallet');


const HTTP_PORT = process.env.HTTP_PORT || 3001;
var wallet;
const app = express();
const bc = new Blockchain();
if(HTTP_PORT == 3003){ //instead of port check, check if user pubkey is not null in database pass that into EWallet
    wallet = new EWallet("04f2b533fc5fca45ed7bc9d8726a6637d51c7d097854f7c8e3f86fd94f68999d27f8e59cc864af25e53ac12c852083cbc55235d40e72b430e78a613f39d4e8c591")
}
else{ //when pubkey is null cause they just made their account give em a new wallet so itll generate and shit
    wallet = new Wallet();
}
const tp = new TransactionPool();
const p2pServer= new P2pServer(bc, tp);
const miner = new Miner(bc, tp, p2pServer);


app.use(bodyParser.json());


app.get('/blocks', (req, res) => {
    res.json(bc.chain);
});

app.post('/mine', (req,res) => {
    const block = bc.addBlock(req.body.data);
    console.log(`new block added: ${block.toString()}`);

    p2pServer.syncChain();

    res.redirect('/blocks');
});

app.get('/transactions', (req, res) => {
    res.json(tp.transactions);
});

app.get('/mine-transactions', (req, res) => {
    const block = miner.mine();
    console.log(`New block added: ${block.toString()}`);
    res.redirect('/blocks');
});

app.get('/userWallet', (req, res) => {
    const b = wallet.calculateBalance(bc);
    res.json({publicKey: wallet.publicKey, Balance: b});
});

app.get('/checkWallet:id', (req, res) => {
    const wall = new EWallet(req.params.id);
    const b = wall.calculateBalance(bc);
    res.json({publicKey: wall.publicKey, Balance: b});
});

/*app.get('/balance', (req, res) => {
    res.json({Balance: wallet.balance});
});*/

app.post('/transact', (req, res) => {
    const { recipient, amount } = req.body;
    const transaction = wallet.createTransaction(recipient, amount, bc, tp);
    p2pServer.broadcastTransaction(transaction);
    const block = miner.mine();
    res.redirect('/blocks');
});

app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
  });

app.listen(HTTP_PORT, () => console.log(`Listening on port ${HTTP_PORT}`));
p2pServer.listen();