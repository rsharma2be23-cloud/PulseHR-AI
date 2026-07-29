const { ApiError } = require("../utils/apiError");
const { canViewEmployee, getEmployeeById } = require("../services/employee.service");
const { generateManagerCoachingReport } = require("../services/managerCoach.service");

async function generate(request, response, next) {
  try {
    const employee = await getEmployeeById(request.params.employeeId);
    if (!(await canViewEmployee(employee, request.user))) throw new ApiError(403, "You do not have permission to generate coaching for this employee.");
    const coaching = await generateManagerCoachingReport(employee);
    response.status(200).json({ success: true, data: coaching });
  } catch (error) { next(error); }
}

module.exports = { generate };
