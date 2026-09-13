// Central list of job types TaskFlow understands. Shared by the API
// (request validation) and the worker (handler dispatch) so they can't
// drift out of sync.
const JOB_TYPES = ['send-email', 'process-data', 'fail-twice', 'always-fail'];

module.exports = { JOB_TYPES };
