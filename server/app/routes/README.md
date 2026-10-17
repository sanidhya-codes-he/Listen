# routes/  - the front desk (Doc 07)

One file per area (auth, devices, sync, analytics, commands, library). Each endpoint is a function with
@router.get/post/patch/delete. Validates input (Pydantic), checks who you are, calls a service, returns JSON.
