def accuracy_score(predictions, expected):
    correct = 0

    for pred, exp in zip(predictions, expected):
        if pred == exp:
            correct += 1
    
    return correct / len(expected)


def top_k_accuracy(predicted_sections, expected_section):
    return int(expected_section in predicted_sections)