/**
 * Wrapper around cucumber-html to interact with cucumber-runner
 * and set up the run button and output automatically
 */
(function () {
    "use strict";

    //from example, uses cucumber-html (which is bundled in cucumber.js)
    var cucumberHTMLListener = function ($root) {
        var CucumberHTML = window.CucumberHTML;
        var formatter = new CucumberHTML.DOMFormatter($root);

        formatter.uri('report.feature');

        var currentStep;

        var self = {
            hear: function hear(event, callback) {
                var eventName = event.getName();
                switch (eventName) {
                    case 'BeforeFeature':
                        var feature = event.getPayloadItem('feature');
                        formatter.feature({
                            keyword: feature.getKeyword(),
                            name: feature.getName(),
                            line: feature.getLine(),
                            description: feature.getDescription()
                        });
                        break;

                    case 'BeforeScenario':
                        var scenario = event.getPayloadItem('scenario');
                        formatter.scenario({
                            keyword: scenario.getKeyword(),
                            name: scenario.getName(),
                            line: scenario.getLine(),
                            description: scenario.getDescription()
                        });
                        break;

                    case 'BeforeStep':
                        var step = event.getPayloadItem('step');
                        self.handleAnyStep(step);
                        break;

                    case 'StepResult':
                        var result;
                        var stepResult = event.getPayloadItem('stepResult');
                        if (stepResult.isSuccessful()) {
                            result = {status: 'passed'};
                        } else if (stepResult.isPending()) {
                            result = {status: 'pending'};
                        } else if (stepResult.isUndefined() || stepResult.isSkipped()) {
                            result = {status: 'skipped'};
                        } else {
                            var error = stepResult.getFailureException();
                            var errorMessage = error.stack || error;
                            result = {status: 'failed', error_message: errorMessage};
                        }
                        formatter.match({uri: 'report.feature', step: {line: currentStep.getLine()}});
                        formatter.result(result);
                        break;
                }
                callback();
            },

            handleAnyStep: function handleAnyStep(step) {
                formatter.step({
                    keyword: step.getKeyword(),
                    name: step.getName(),
                    line: step.getLine(),
                });
                currentStep = step;
            }
        };
        return self;
    };

    var output = $("<div id='output' class='cucumber-report'></div>"),
        runButton = $("<button id='run'>Run</button>");

    //setup the run button and add the output div
    var initialize = function () {
        $(document).ready(function () {
            var body = $("body");
            runButton.appendTo(body);
            output.appendTo(body);
        });

        runButton.click(function () {
            output.empty();
            Cucumber.run();
        });

        //clear initialization function after it is used once
        initialize = function () {
        };
    };

    /**
     * The default reporter
     */
    Cucumber.HtmlReporter = function () {
        initialize();

        //returns the listener to report on a feature
        this.getListener = function (feature) {
            var featureReport = $("<div></div>");
            output.append(featureReport);
            return cucumberHTMLListener(featureReport);
        };

        return this;
    };
}());