import { FormControl, ValidationErrors } from "@angular/forms";

export class FormValidators {
    //whitespace
    static notOnlyWhitespace(control: FormControl): ValidationErrors {

        //check if only contain whitespace
        if ((control.value != null) && (control.value.trim().length == 0)) {
            return { 'notOnlyWhitespace': true };

        } else {
            return null
        }

    }
}
