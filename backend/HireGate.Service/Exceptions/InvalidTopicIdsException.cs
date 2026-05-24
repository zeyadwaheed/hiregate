namespace HireGate.Service.Exceptions;

public class InvalidTopicIdsException : Exception
{
    public InvalidTopicIdsException(IEnumerable<int> ids)
        : base($"Topic IDs not found: {string.Join(", ", ids)}") { }
}
