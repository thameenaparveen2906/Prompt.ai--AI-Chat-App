from rest_framework import serializers

from prompt_app.models import Chat, ChatMessage 

     

class ChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chat 
        fields = "__all__"



class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage 
        fields = ["role", "content"]