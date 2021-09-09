function Validator(options)
{
    let selectorRules={};
    let formElement = document.querySelector(options.form);

    // function này có là do có thể thẻ inputElement có nhiều cha chúng ta phải đi tìm thẻ cha lớn nhất
    function getParent(element, selector){

        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }

    }

    function validate(inputElement,rule)
    {

        let errorElement = getParent(inputElement,options.elementParent).querySelector(options.errorSelector);
        let errorMessage;

        //lấy ra các rule của selector & kiểm tra
        //Nếu mà có lỗi là dừng việc kiểm tra luôn
        let rules = selectorRules[rule.selector];

        // lặp qua các rule của selector
        for (let i = 0; i < rules.length; i++) {

            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    )
                    break;
                default:
                    errorMessage = rules[i](inputElement.value)
                    break;
            }
            ;            
            if(errorMessage) break;
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement,options.elementParent).classList.add('invalid');
        }
        else{
            errorElement.innerText = '';
            getParent(inputElement,options.elementParent).classList.remove('invalid');
        }
        return !errorMessage;
    }



    // submit Form
    formElement.addEventListener('submit',(e)=>{
        e.preventDefault();
        let isFormValid = true;


        // Lặp qua tất cả các rules và validate 
        options.rules.forEach(rule => {
            let inputElement = formElement.querySelector(rule.selector);
            
            let isValid = validate(inputElement,rule);
            if (!isValid) {
                isFormValid = false;
            }
        });

        if (isFormValid) {
            // Trường hợp submit với Javascript
            if (typeof options.onSubmit == "function") {
                
                let enableInputs = formElement.querySelectorAll("[name]:not([disabled])");
                let formValue = Array.from(enableInputs).reduce((values, input)=>{
                    switch (input.type) {
                        case 'radio':
                            values[input.name] = formElement.querySelector(`input[name="${input.name}"]:checked`).value;
                            break;
                        case 'checkbox':
                            if (!input.matches(':checked')) {
                                values[input.name] = '';
                                return values;
                            }
                            if (!Array.isArray(values[input.name])) {
                                values[input.name] = [];
                            }
                            values[input.name].push(input.value);
                            break;
                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;
                            break;
                    }
                    return values;
                },{})

                options.onSubmit(formValue)
            }
            // Trường hợp submit với hành vi mặc định
            else
            {
                formElement.submit();
            }
        }
    });

    // Lặp qua mỗi rule và xử lý (lắng nghe sự kiện blur, inuput,...)

    if (formElement) {
        options.rules.forEach(rule => {
            // lưu lại các rule.test() trong mỗi input

            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            }
            else{
                selectorRules[rule.selector] = [rule.test];
            }

            let inputElements = formElement.querySelectorAll(rule.selector);
            
            Array.from(inputElements).forEach((inputElement)=>{
                inputElement.onblur = ()=>{
                    validate(inputElement,rule);
                }
                 inputElement.oninput = ()=>{
                    validate(inputElement,rule);
                }
            });
        });     
    }
}

Validator.isRequired = function(selector, message){
    return {selector,
        test:function(value){
            return value ? undefined :  message||"Vui lòng nhập trường này";
        }
    };
}

Validator.isEmail = function(selector, message){
    return {selector,
        test:function(value){
            let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value)? undefined : message||"Trường này phải là email"
        }
    };
}
Validator.minLength = function(selector,min, message){
    return {selector,
        test:function(value){
            return value.length >= min ? undefined :  message||`Vui lòng nhập vào tối thiểu ${min} ký tự`;
        }
    };
}

Validator.isConfirmed = function(selector, getConfirmValue, message)
{
    return {
        selector,
        test:function (value) {
            return value == getConfirmValue() ?undefined : message||"Giá trị nhập vào không chính xác";
        }
    }
}