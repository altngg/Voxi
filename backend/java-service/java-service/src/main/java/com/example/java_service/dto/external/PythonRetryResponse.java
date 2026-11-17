package com.example.java_service.dto.external;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class PythonRetryResponse {

    @JsonProperty("tasks")
    private List<NewTask> tasks;

    @JsonProperty("incorrect_tasks_explanations")
    private List<IncorrectTaskExplanation> incorrectTasksExplanations;

    @Data
    public static class IncorrectTaskExplanation {

        @JsonProperty("incorrect_task_id")
        private Long incorrectTaskId;

        private String explanation;
    }

    @Data
    public static class NewTask {
        private String name;
        private String answer;
        private String topic;
        private List<String> options;

        @JsonProperty("task_type")
        private String taskType;
    }
}