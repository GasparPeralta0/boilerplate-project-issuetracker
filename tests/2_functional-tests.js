const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;

const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  const project = 'apitest';
  let testId;

  suite('POST /api/issues/{project} => object with issue data', function () {
    test('Create an issue with every field', function (done) {
      chai
        .request(server)
        .post(`/api/issues/${project}`)
        .send({
          issue_title: 'Title A',
          issue_text: 'Text A',
          created_by: 'Tester',
          assigned_to: 'Dev',
          status_text: 'In QA'
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);

          assert.property(res.body, '_id');
          assert.property(res.body, 'issue_title');
          assert.property(res.body, 'issue_text');
          assert.property(res.body, 'created_by');
          assert.property(res.body, 'assigned_to');
          assert.property(res.body, 'status_text');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'updated_on');
          assert.property(res.body, 'open');

          assert.equal(res.body.issue_title, 'Title A');
          assert.equal(res.body.issue_text, 'Text A');
          assert.equal(res.body.created_by, 'Tester');
          assert.equal(res.body.assigned_to, 'Dev');
          assert.equal(res.body.status_text, 'In QA');
          assert.equal(res.body.open, true);

          testId = res.body._id;
          done();
        });
    });

    test('Create an issue with only required fields', function (done) {
      chai
        .request(server)
        .post(`/api/issues/${project}`)
        .send({
          issue_title: 'Title B',
          issue_text: 'Text B',
          created_by: 'Tester2'
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);

          assert.property(res.body, '_id');
          assert.equal(res.body.issue_title, 'Title B');
          assert.equal(res.body.issue_text, 'Text B');
          assert.equal(res.body.created_by, 'Tester2');

          // opcionales deben volver como ""
          assert.equal(res.body.assigned_to, '');
          assert.equal(res.body.status_text, '');
          assert.equal(res.body.open, true);

          done();
        });
    });

    test('Create an issue with missing required fields', function (done) {
      chai
        .request(server)
        .post(`/api/issues/${project}`)
        .send({
          issue_title: 'Title C'
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'required field(s) missing' });
          done();
        });
    });
  });

  suite('GET /api/issues/{project} => array of issue objects', function () {
    test('View issues on a project', function (done) {
      chai
        .request(server)
        .get(`/api/issues/${project}`)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);

          if (res.body.length) {
            const i = res.body[0];
            assert.property(i, '_id');
            assert.property(i, 'issue_title');
            assert.property(i, 'issue_text');
            assert.property(i, 'created_by');
            assert.property(i, 'assigned_to');
            assert.property(i, 'status_text');
            assert.property(i, 'created_on');
            assert.property(i, 'updated_on');
            assert.property(i, 'open');
          }

          done();
        });
    });

    test('View issues on a project with one filter', function (done) {
      chai
        .request(server)
        .get(`/api/issues/${project}?open=true`)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          res.body.forEach(i => assert.equal(i.open, true));
          done();
        });
    });

    test('View issues on a project with multiple filters', function (done) {
      chai
        .request(server)
        .get(`/api/issues/${project}?open=true&created_by=Tester`)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          res.body.forEach(i => {
            assert.equal(i.open, true);
            assert.equal(i.created_by, 'Tester');
          });
          done();
        });
    });
  });

  suite('PUT /api/issues/{project} => text', function () {
    test('Update one field on an issue', function (done) {
      chai
        .request(server)
        .put(`/api/issues/${project}`)
        .send({ _id: testId, issue_text: 'Text A updated' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully updated', _id: testId });
          done();
        });
    });

    test('Update multiple fields on an issue', function (done) {
      chai
        .request(server)
        .put(`/api/issues/${project}`)
        .send({
          _id: testId,
          issue_title: 'Title A updated',
          assigned_to: 'Dev2',
          status_text: 'Done',
          open: false
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully updated', _id: testId });
          done();
        });
    });

    test('Update an issue with missing _id', function (done) {
      chai
        .request(server)
        .put(`/api/issues/${project}`)
        .send({ issue_title: 'No id' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'missing _id' });
          done();
        });
    });

    test('Update an issue with no fields to update', function (done) {
      chai
        .request(server)
        .put(`/api/issues/${project}`)
        .send({ _id: testId })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'no update field(s) sent', _id: testId });
          done();
        });
    });

    test('Update an issue with an invalid _id', function (done) {
      chai
        .request(server)
        .put(`/api/issues/${project}`)
        .send({ _id: 'invalidid', issue_title: 'X' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not update', _id: 'invalidid' });
          done();
        });
    });
  });

  suite('DELETE /api/issues/{project} => text', function () {
    test('Delete an issue', function (done) {
      chai
        .request(server)
        .delete(`/api/issues/${project}`)
        .send({ _id: testId })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully deleted', _id: testId });
          done();
        });
    });

    test('Delete an issue with an invalid _id', function (done) {
      chai
        .request(server)
        .delete(`/api/issues/${project}`)
        .send({ _id: 'invalidid' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not delete', _id: 'invalidid' });
          done();
        });
    });

    test('Delete an issue with missing _id', function (done) {
      chai
        .request(server)
        .delete(`/api/issues/${project}`)
        .send({})
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'missing _id' });
          done();
        });
    });
  });
});