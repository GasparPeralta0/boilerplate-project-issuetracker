'use strict';

const mongoose = require('mongoose');
const Issue = require('../models/Issue');

module.exports = function (app) {
  app.route('/api/issues/:project')

    // CREATE
    .post(async (req, res) => {
      try {
        const project = req.params.project;

        const {
          issue_title,
          issue_text,
          created_by,
          assigned_to,
          status_text
        } = req.body || {};

        if (!issue_title || !issue_text || !created_by) {
          return res.json({ error: 'required field(s) missing' });
        }

        const now = new Date();

        const doc = await Issue.create({
          project,
          issue_title,
          issue_text,
          created_by,
          assigned_to: assigned_to || '',
          status_text: status_text || '',
          created_on: now,
          updated_on: now,
          open: true
        });

        // devolver el issue creado con todos los campos
        return res.json({
          _id: doc._id.toString(),
          issue_title: doc.issue_title,
          issue_text: doc.issue_text,
          created_by: doc.created_by,
          assigned_to: doc.assigned_to,
          status_text: doc.status_text,
          created_on: doc.created_on,
          updated_on: doc.updated_on,
          open: doc.open
        });
      } catch (e) {
        return res.status(500).json({ error: 'internal error' });
      }
    })

    // READ (con filtros)
    .get(async (req, res) => {
      try {
        const project = req.params.project;

        // Construye filtros desde querystring (permitir cualquiera de los campos)
        const q = { project };
        const allowed = [
          '_id',
          'issue_title',
          'issue_text',
          'created_by',
          'assigned_to',
          'status_text',
          'open',
          'created_on',
          'updated_on'
        ];

        for (const k of allowed) {
          if (req.query[k] !== undefined) {
            if (k === 'open') {
              // open puede venir como "true"/"false"
              q.open = String(req.query.open) === 'true';
            } else {
              q[k] = req.query[k];
            }
          }
        }

        const docs = await Issue.find(q).select('-__v -project').lean();

        // freeCodeCamp espera array de issues con sus campos (sin project)
        return res.json(
          docs.map(d => ({
            ...d,
            _id: d._id.toString()
          }))
        );
      } catch (e) {
        return res.status(500).json({ error: 'internal error' });
      }
    })

    // UPDATE
    .put(async (req, res) => {
      try {
        const project = req.params.project;
        const { _id, ...rest } = req.body || {};

        if (!_id) return res.json({ error: 'missing _id' });

        // Campos actualizables (cualquiera excepto _id / project / created_on)
        const updatable = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text', 'open'];

        let hasUpdate = false;
        const update = {};
        for (const k of updatable) {
          if (rest[k] !== undefined && rest[k] !== '') {
            hasUpdate = true;
            update[k] = rest[k];
          }
          // OJO: si quieren setear open=false, el valor puede venir como "false" o false
          if (k === 'open' && rest.open !== undefined && rest.open !== '') {
            hasUpdate = true;
            update.open = (String(rest.open) === 'true');
          }
        }

        // Si mandan open explícitamente vacío, no cuenta como update
        // Si mandan strings vacíos, no cuenta (FCC suele enviar solo los que quiere)
        if (!hasUpdate) return res.json({ error: 'no update field(s) sent', _id });

        update.updated_on = new Date();

        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(_id)) {
          return res.json({ error: 'could not update', _id });
        }

        const updated = await Issue.findOneAndUpdate(
          { _id, project },
          { $set: update },
          { new: true }
        );

        if (!updated) return res.json({ error: 'could not update', _id });

        return res.json({ result: 'successfully updated', _id });
      } catch (e) {
        // Cualquier otro error -> could not update
        return res.json({ error: 'could not update', _id: (req.body && req.body._id) || undefined });
      }
    })

    // DELETE
    .delete(async (req, res) => {
      try {
        const project = req.params.project;
        const { _id } = req.body || {};

        if (!_id) return res.json({ error: 'missing _id' });

        if (!mongoose.Types.ObjectId.isValid(_id)) {
          return res.json({ error: 'could not delete', _id });
        }

        const del = await Issue.findOneAndDelete({ _id, project });

        if (!del) return res.json({ error: 'could not delete', _id });

        return res.json({ result: 'successfully deleted', _id });
      } catch (e) {
        return res.json({ error: 'could not delete', _id: (req.body && req.body._id) || undefined });
      }
    });
};