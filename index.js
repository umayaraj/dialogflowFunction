const functions = require('firebase-functions');
const express = require('express');
const firebaseBrain = require('./model/FirebaseBrain');
const dialogflowBrain = require('./model/DialogflowBrain');
const app = express();

app.get('/', (req, res) => {
    res.send('Server Is Live');
});

app.get('/goal/:id', async (req, res) => {
    let uid = req.params.id;
    var data = await firebaseBrain.readGoal(uid);
    res.status(200).send(data);
});

app.post('/goal', async (req, res) => {
    let uid = req.body.uid;
    delete req.body.uid;
    try {
        let docRef = await firebaseBrain.saveGoal(uid, req.body);
        res.status(201).send(docRef);
    } catch (e) {
        res.status(406).send(e);
    }
});

app.put('/goal',async (req,res)=>{
    let uid = req.body.uid;
    let docId = req.body.docId;
    delete req.body.uid;
    delete req.body.docId;
    try {
        let docRef = await firebaseBrain.updateGoal(uid, docId, req.body);
        res.status(201).send(docRef);
    } catch (e) {
        res.status(400).send(e);
    }
}); 

app.delete('/goal',async (req,res)=>{
    let uid = req.body.uid;
    let docId = req.body.docId;
    try {
        let docRef = await firebaseBrain.deleteGoal(uid,docId);
        res.status(201).send(docRef);
    } catch (e) {
        res.status(400).send(e);
    }
});

app.post('/userInfoUpdate',async (req,res)=>{
    let uid = req.body.uid;
    let name = req.body.name;
    try {
        let docRef = await firebaseBrain.Updateuser(uid,name);
        res.status(201).send(docRef);
    } catch (e) {
        res.status(400).send(e);
    }
});

exports.firebaseBrain = functions.https.onRequest(app);

exports.dialogflowBrain = functions.https.onRequest(dialogflowBrain.master);
