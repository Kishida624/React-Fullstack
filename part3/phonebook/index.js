const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();
const Phonebook = require('./models/phonebook');

app.use(express.json());

morgan.token('tiny', function (req) {
  return JSON.stringify(req.body);
});
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :tiny')
);
app.use(cors());
app.use(express.static('build'));

app.get('/api/persons', async (req, res) => {
  try {
    const phonebookList = await Phonebook.find({});
    return res.json(phonebookList);
  } catch (error) {
    console.error('getPhonebookListError', error);
    return res.status(404).json({ error: 'error getting all phonebooks' });
  }
});

app.get('/info', async (req, res, next) => {
  try {
    const current_time = new Date().toString();
    const phonebookList = await Phonebook.find({});
    res
      .status(201)
      .send(
        `Phonebook has info for ${phonebookList.length} people \n${current_time}`
      );
  } catch (error) {
    next(error);
  }
});

app.get('/api/persons/:personId', async (req, res, next) => {
  try {
    const result = await Phonebook.findById(req.params.personId);
    if (result) {
      res.json(result);
    } else {
      res.status(404).end();
    }
  } catch (error) {
    next(error);
  }
});

app.delete('/api/persons/:personId', async (req, res, next) => {
  try {
    const result = await Phonebook.findByIdAndRemove(req.params.personId);
    if (result) {
      res.status(201).json({ message: 'deleted successfully' });
    } else {
      res.status(404).end();
    }
  } catch (error) {
    next(error);
  }
});

app.post('/api/persons', async (req, res, next) => {
  const data = req.body;
  if (!Object.keys(data).length) {
    return res.status(404).json({ error: 'content missing' });
  }
  const phonebook = new Phonebook({
    name: data.name,
    number: data.number,
  });
  try {
    const savedPhoneBook = await phonebook.save();
    res.status(201).json(savedPhoneBook);
  } catch (error) {
    next(error);
  }
});

app.put('/api/persons/:personId', async (req, res, next) => {
  console.log('updated data', req.body);
  const data = req.body;
  const id = req.params.personId;
  if (!Object.keys(data).length) {
    return res.status(404).json({ error: 'content missing' });
  }
  try {
    const updatedPhoneBook = await Phonebook.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
      context: 'query',
    });
    console.log('updatedPhoneBook', updatedPhoneBook);
    res.status(201).json(updatedPhoneBook);
  } catch (error) {
    next(error);
  }
});

const errorHandler = (error, req, res, next) => {
  console.error(error.message);
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'malformatted id' });
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  next(error);
};
const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' });
};
app.use(unknownEndpoint);
app.use(errorHandler);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
