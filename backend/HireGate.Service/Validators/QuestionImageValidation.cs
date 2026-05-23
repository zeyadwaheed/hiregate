namespace HireGate.Service.Validators
{
    internal static class QuestionImageValidation
    {
        public static bool IsValid(string? imagePathOrUrl)
        {
            if (string.IsNullOrWhiteSpace(imagePathOrUrl))
            {
                return true;
            }

            if (Uri.TryCreate(imagePathOrUrl, UriKind.Absolute, out var absoluteUri))
            {
                return absoluteUri.Scheme == Uri.UriSchemeHttp || absoluteUri.Scheme == Uri.UriSchemeHttps;
            }

            return imagePathOrUrl.StartsWith('/') && !imagePathOrUrl.Contains(' ');
        }
    }
}
