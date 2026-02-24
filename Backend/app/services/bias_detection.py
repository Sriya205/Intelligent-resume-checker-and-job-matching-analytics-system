def detect_bias(text: str):
    bias_keywords = ["male", "female", "young", "old", "married", "single"]

    found_bias = []

    lower_text = text.lower()

    for word in bias_keywords:
        if word in lower_text:
            found_bias.append(word)

    return {
        "bias_detected": len(found_bias) > 0,
        "bias_keywords_found": found_bias
    }