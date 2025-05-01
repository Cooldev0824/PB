// filepath: d:\Work\ProposalBuilder\backend\server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Proposal = require('../models/Proposal')

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/proposals', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/api/proposals', async (req, res) => {
  try {
    const proposals = await Proposal.find();
    console.log(proposals);
    res.status(201).json(proposals);
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(500).json({ error: 'Failed to fetch proposal' });
  }
});

app.get('/api/proposals/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ error: 'Failed to fetch proposal' });
  }
});

app.post('/api/proposalID', async (req, res) => {
  try {
    const { title, clientName } = req.body; // Destructure the fields from req.body
    const proposal = new Proposal({ title, clientName }); // Create a new Proposal instance
    const savedProposal = await proposal.save(); // Save the proposal to the database
    res.status(201).json(savedProposal); // Return the saved proposal
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(500).json({ error: 'Failed to create proposal' });
  }
});

app.put('/api/proposals/:id', async (req, res) => {
  try {
    const { id, content, background, pageSize } = req.body;
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      {
        content: content,
        background: background,
        pageSize: pageSize,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.status(200).json(proposal);
  } catch (error) {
    console.error('Error updating proposal:', error);
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});

app.delete('/api/proposals/:id', async (req, res) => {
  try {
    await Proposal.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Proposal deleted' });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({ error: 'Failed to delete proposal' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
